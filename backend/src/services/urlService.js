const axios = require('axios');
const { parse: parseHtml } = require('node-html-parser');
const { URL } = require('url');
const dns = require('dns').promises;
const ApiError = require('../utils/ApiError');

/**
 * URL Ingestion Service
 *
 * Provides SSRF-safe URL fetching for research paper ingestion.
 * Supports:
 *   - Direct PDF links (application/pdf)
 *   - HTML research article pages (extracts main article text)
 *
 * Security hardening:
 *   - Private/loopback IP block (SSRF prevention)
 *   - Cloud metadata endpoint block
 *   - Redirect limit (max 5)
 *   - Response size limit (20 MB)
 *   - Connection timeout (15 s)
 *   - DNS resolution check before request
 *   - Content-type validation
 */
class UrlService {
  constructor() {
    this.MAX_RESPONSE_BYTES = 20 * 1024 * 1024; // 20 MB
    this.TIMEOUT_MS = 15000;                      // 15 seconds
    this.MAX_REDIRECTS = 5;
    this.MIN_TEXT_LENGTH = 200;                   // chars

    // Private/reserved IP ranges to block (SSRF)
    this.PRIVATE_CIDRS = [
      /^127\./,                           // loopback
      /^10\./,                            // RFC-1918 class A
      /^172\.(1[6-9]|2\d|3[01])\./,      // RFC-1918 class B
      /^192\.168\./,                      // RFC-1918 class C
      /^169\.254\./,                      // link-local
      /^::1$/,                            // IPv6 loopback
      /^fc00:/i,                          // IPv6 unique local
      /^fd[0-9a-f]{2}:/i,                // IPv6 unique local
      /^fe80:/i,                          // IPv6 link-local
    ];

    // Cloud metadata endpoints
    this.BLOCKED_HOSTS = new Set([
      'metadata.google.internal',
      '169.254.169.254',
      'metadata.azure.com',
      '169.254.170.2',
      'fd00:ec2::254',
    ]);
  }

  /**
   * Validate URL structure and scheme
   * @param {string} rawUrl
   * @returns {{ parsed: URL, error: string|null }}
   */
  validateUrlFormat(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { parsed: null, error: 'URL is required.' };
    }

    let parsed;
    try {
      parsed = new URL(rawUrl.trim());
    } catch (e) {
      return { parsed: null, error: 'The provided URL is invalid. Please enter a valid http:// or https:// URL.' };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { parsed: null, error: 'Only http and https URLs are allowed.' };
    }

    const host = parsed.hostname.toLowerCase();

    // Block cloud metadata endpoints by hostname
    if (this.BLOCKED_HOSTS.has(host)) {
      return { parsed: null, error: 'Access to this URL destination is blocked for security reasons.' };
    }

    // Block localhost by name
    if (host === 'localhost' || host === '0.0.0.0') {
      return { parsed: null, error: 'Connections to localhost are not permitted.' };
    }

    return { parsed, error: null };
  }

  /**
   * Check resolved IP addresses for private/cloud ranges (SSRF prevention)
   * @param {string} hostname
   * @returns {Promise<{safe: boolean, reason: string|null}>}
   */
  async checkDnsResolution(hostname) {
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const { address } of addresses) {
        if (this.isPrivateIp(address)) {
          return { safe: false, reason: `Resolved IP address ${address} is in a private/reserved range.` };
        }
      }
      return { safe: true, reason: null };
    } catch (err) {
      return { safe: false, reason: `DNS resolution failed for hostname: ${hostname}` };
    }
  }

  /**
   * Check if an IP address falls within private/reserved ranges
   * @param {string} ip
   * @returns {boolean}
   */
  isPrivateIp(ip) {
    return this.PRIVATE_CIDRS.some(pattern => pattern.test(ip));
  }

  /**
   * Safely fetch a URL with SSRF protection, timeouts, size limits, and redirect safety.
   * @param {string} rawUrl
   * @returns {Promise<{buffer: Buffer, contentType: string, finalUrl: string, error: string|null}>}
   */
  async safeFetch(rawUrl) {
    const { parsed, error: formatError } = this.validateUrlFormat(rawUrl);
    if (formatError) return { buffer: null, contentType: null, finalUrl: null, error: formatError };

    // DNS safety check before making the request
    const { safe, reason } = await this.checkDnsResolution(parsed.hostname);
    if (!safe) return { buffer: null, contentType: null, finalUrl: null, error: reason };

    try {
      const response = await axios.get(rawUrl.trim(), {
        responseType: 'arraybuffer',
        timeout: this.TIMEOUT_MS,
        maxRedirects: this.MAX_REDIRECTS,
        maxContentLength: this.MAX_RESPONSE_BYTES,
        maxBodyLength: this.MAX_RESPONSE_BYTES,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PaperMind-AI-Fetcher/1.0; +https://papermind.ai)',
          'Accept': 'application/pdf,text/html,*/*;q=0.8',
        },
        validateStatus: (status) => status >= 200 && status < 400,
        // After each redirect, re-validate the new URL's destination IP
        beforeRedirect: async (options) => {
          const redirectUrl = `${options.protocol}//${options.host}${options.path}`;
          const redirectParsed = this.validateUrlFormat(redirectUrl);
          if (redirectParsed.error) {
            throw new Error(`Redirect blocked: ${redirectParsed.error}`);
          }
          const redirectDns = await this.checkDnsResolution(redirectParsed.parsed.hostname);
          if (!redirectDns.safe) {
            throw new Error(`Redirect blocked: ${redirectDns.reason}`);
          }
        },
      });

      const contentType = (response.headers['content-type'] || '').toLowerCase();
      const finalUrl = response.request?.res?.responseUrl || rawUrl;
      const buffer = Buffer.from(response.data);

      // Enforce final response size
      if (buffer.length > this.MAX_RESPONSE_BYTES) {
        return {
          buffer: null,
          contentType: null,
          finalUrl: null,
          error: 'The response from the URL exceeds the 20 MB size limit.',
        };
      }

      return { buffer, contentType, finalUrl, error: null };
    } catch (err) {
      const msg = err.message || 'Unknown error';

      if (err.code === 'ECONNABORTED' || msg.includes('timeout')) {
        return { buffer: null, contentType: null, finalUrl: null, error: 'The request timed out. The server may be slow or the URL may be inaccessible.' };
      }
      if (err.response && err.response.status === 403) {
        return { buffer: null, contentType: null, finalUrl: null, error: 'Access to this URL was denied (403 Forbidden). The page may require authentication or restrict automated access.' };
      }
      if (err.response && err.response.status === 404) {
        return { buffer: null, contentType: null, finalUrl: null, error: 'The URL returned a 404 Not Found error. Please check that the URL is correct and the paper is publicly accessible.' };
      }
      if (err.response && err.response.status >= 400) {
        return { buffer: null, contentType: null, finalUrl: null, error: `The server returned HTTP ${err.response.status}. The URL may be paywalled or inaccessible.` };
      }
      if (msg.includes('maxContentLength') || msg.includes('maxBodyLength')) {
        return { buffer: null, contentType: null, finalUrl: null, error: 'The response from the URL exceeds the 20 MB size limit.' };
      }
      if (msg.includes('Redirect blocked')) {
        return { buffer: null, contentType: null, finalUrl: null, error: msg };
      }

      return { buffer: null, contentType: null, finalUrl: null, error: `Failed to fetch the URL: ${msg}` };
    }
  }

  /**
   * Extract the main article text from an HTML page.
   * Removes nav, header, footer, ads, scripts, and cookie banners.
   * Falls back to body text if no semantic article element found.
   * @param {string} html
   * @returns {string}
   */
  extractTextFromHtml(html) {
    try {
      const root = parseHtml(html, { script: false, style: false, comment: false });

      // Remove noise elements
      const noiseSelectors = [
        'script', 'style', 'noscript', 'nav', 'header', 'footer',
        'aside', 'advertisement', '.ad', '.ads', '.advertisement',
        '.cookie-banner', '.cookie-notice', '.navbar', '.sidebar',
        '.menu', '.social-share', '.related-articles', '.comments',
        '[aria-hidden="true"]', 'form', 'button', 'iframe',
      ];

      noiseSelectors.forEach(sel => {
        root.querySelectorAll(sel).forEach(el => el.remove());
      });

      // Try semantic article containers in preference order
      const selectors = [
        'article',
        '[role="main"]',
        'main',
        '.article-body',
        '.post-content',
        '.entry-content',
        '.content',
        '#content',
        '#main-content',
        '.paper-content',
        '.abstract',
        '.full-text',
      ];

      for (const sel of selectors) {
        const el = root.querySelector(sel);
        if (el) {
          const text = el.structuredText || el.text || '';
          if (text.trim().length >= this.MIN_TEXT_LENGTH) {
            return this.cleanText(text);
          }
        }
      }

      // Final fallback: body text
      const body = root.querySelector('body');
      const bodyText = body ? (body.structuredText || body.text || '') : (root.structuredText || root.text || '');
      return this.cleanText(bodyText);
    } catch (err) {
      console.error('[UrlService] HTML parse error:', err.message);
      return '';
    }
  }

  /**
   * Normalize and clean extracted text
   * @param {string} text
   * @returns {string}
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ \t]{3,}/g, '  ')        // collapse long horizontal whitespace
      .replace(/\n{4,}/g, '\n\n\n')       // collapse many blank lines to max 3
      .trim();
  }

  /**
   * Infer a human-readable title from the HTML page <title> or <h1>
   * @param {string} html
   * @returns {string}
   */
  extractTitleFromHtml(html) {
    try {
      const root = parseHtml(html, { script: false, style: false });
      const title = root.querySelector('title');
      if (title && title.text.trim().length > 0 && title.text.trim().length < 300) {
        return title.text.trim()
          .replace(/\s*[\|•–—]\s*.+$/, '')   // strip site name suffix
          .trim();
      }
      const h1 = root.querySelector('h1');
      if (h1 && h1.text.trim().length > 0) return h1.text.trim();
    } catch (e) {}
    return '';
  }

  /**
   * Main entry point: fetch a URL and extract paper text.
   * Returns { text, title, sourceUrl, contentType, error }
   *
   * @param {string} rawUrl
   * @param {Function} [pdfExtractFn] - optional function(buffer) => { text, pageCount, wordCount, characterCount }
   * @returns {Promise<Object>}
   */
  async fetchAndExtract(rawUrl, pdfExtractFn = null) {
    const { buffer, contentType, finalUrl, error } = await this.safeFetch(rawUrl);
    if (error) return { text: '', title: '', sourceUrl: rawUrl, contentType: null, error };

    const isPdf = contentType.includes('application/pdf') || finalUrl.toLowerCase().endsWith('.pdf');
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');

    // ── PDF Handling ─────────────────────────────────────────────────────────
    if (isPdf) {
      if (!pdfExtractFn) {
        return { text: '', title: '', sourceUrl: finalUrl, contentType, error: 'PDF extraction function not provided.' };
      }
      try {
        const extracted = await pdfExtractFn(buffer);
        if (!extracted.text || extracted.text.trim().length < this.MIN_TEXT_LENGTH) {
          return { text: '', title: '', sourceUrl: finalUrl, contentType, error: 'The PDF appears to be scanned or contains insufficient readable text for summarization.' };
        }
        const title = this.guessTitleFromText(extracted.text) || 'Untitled Research Paper';
        return {
          text: extracted.text,
          title,
          sourceUrl: finalUrl,
          contentType,
          pageCount: extracted.pageCount || 1,
          wordCount: extracted.wordCount || 0,
          characterCount: extracted.characterCount || 0,
          error: null,
        };
      } catch (err) {
        return { text: '', title: '', sourceUrl: finalUrl, contentType, error: `PDF text extraction failed: ${err.message}` };
      }
    }

    // ── HTML Article Handling ─────────────────────────────────────────────────
    if (isHtml) {
      const html = buffer.toString('utf-8');
      const text = this.extractTextFromHtml(html);

      if (!text || text.trim().length < this.MIN_TEXT_LENGTH) {
        return {
          text: '',
          title: '',
          sourceUrl: finalUrl,
          contentType,
          error: 'Could not extract sufficient article text from this page. The content may be paywalled, dynamically loaded (JavaScript-rendered), or the page is not a research article.',
        };
      }

      const title = this.extractTitleFromHtml(html) || this.guessTitleFromText(text) || 'Untitled Research Article';
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const characterCount = text.length;
      const pageCount = Math.max(1, Math.round(wordCount / 250));

      return {
        text,
        title,
        sourceUrl: finalUrl,
        contentType,
        pageCount,
        wordCount,
        characterCount,
        error: null,
      };
    }

    // ── Unsupported Content Type ──────────────────────────────────────────────
    return {
      text: '',
      title: '',
      sourceUrl: finalUrl,
      contentType,
      error: `Unsupported content type: "${contentType}". Only PDF files and HTML research article pages are supported.`,
    };
  }

  /**
   * Attempt to guess the paper title from the first few lines of extracted text
   * @param {string} text
   * @returns {string}
   */
  guessTitleFromText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && l.length < 300);
    for (const line of lines.slice(0, 10)) {
      // Skip lines that look like headers, author lists, or metadata
      if (/^(abstract|introduction|keywords|doi:|arxiv:|published|author|university)/i.test(line)) continue;
      if (line.length >= 15) return line;
    }
    return '';
  }
}

module.exports = new UrlService();

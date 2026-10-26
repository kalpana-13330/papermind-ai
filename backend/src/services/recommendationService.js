const axios = require('axios');

/**
 * Recommendation Service
 *
 * Discovers related research papers for a given paper, using:
 *   1. Semantic Scholar API (primary)
 *   2. OpenAlex API (fallback)
 *
 * Strategy:
 *   - Extracts keywords from the paper title and objective/summary
 *   - Queries Semantic Scholar first; if result count < MIN_RESULTS, falls back to OpenAlex
 *   - Deduplicates results by title
 *   - Returns a normalised array of paper objects
 */
class RecommendationService {
  constructor() {
    this.SEMANTIC_SCHOLAR_BASE = 'https://api.semanticscholar.org/graph/v1';
    this.OPENALEX_BASE = 'https://api.openalex.org';
    this.TIMEOUT_MS = 12000;
    this.MAX_RESULTS = 8;
    this.MIN_RESULTS = 3;  // If primary gives fewer than this, use fallback too
  }

  // ── Keyword Extraction ──────────────────────────────────────────────────────

  /**
   * Extract a concise search query from the paper title and/or objective text.
   * Returns a short phrase (≤ 10 words) for best API results.
   */
  buildSearchQuery(title = '', summaryText = '') {
    // Clean and use the title if it's specific enough
    const cleanTitle = title.trim().replace(/[^\w\s-]/g, '').trim();

    // If the title has at least 4 meaningful words, use it directly
    const titleWords = cleanTitle.split(/\s+/).filter(w => w.length > 2);
    if (titleWords.length >= 4) {
      return titleWords.slice(0, 10).join(' ');
    }

    // Otherwise extract keywords from summaryText
    if (summaryText && summaryText.length > 50) {
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
        'those', 'we', 'our', 'their', 'its', 'it', 'not', 'no', 'as', 'well',
        'also', 'which', 'however', 'paper', 'study', 'research', 'work',
        'propose', 'present', 'show', 'demonstrate', 'using', 'use', 'based',
      ]);

      const words = summaryText
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      // Score by frequency
      const freq = {};
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      const top = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([word]) => word);

      if (top.length >= 3) return top.join(' ');
    }

    return cleanTitle || title;
  }

  // ── Normalization ───────────────────────────────────────────────────────────

  normalizeSemanticScholar(papers) {
    return papers
      .filter(p => p.title)
      .map(p => ({
        title: p.title,
        authors: (p.authors || []).map(a => a.name).filter(Boolean).slice(0, 3),
        year: p.year || null,
        abstract: (p.abstract || '').slice(0, 400) + (p.abstract && p.abstract.length > 400 ? '…' : ''),
        url: p.openAccessPdf?.url || (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : null) || (p.paperId ? `https://www.semanticscholar.org/paper/${p.paperId}` : null),
        source: 'Semantic Scholar',
        citationCount: p.citationCount || 0,
        fieldsOfStudy: p.fieldsOfStudy || [],
        openAccess: !!(p.openAccessPdf?.url),
      }));
  }

  normalizeOpenAlex(works) {
    return works
      .filter(w => w.title)
      .map(w => {
        const authors = (w.authorships || [])
          .map(a => a.author?.display_name)
          .filter(Boolean)
          .slice(0, 3);

        const abstract = w.abstract_inverted_index
          ? this.invertedIndexToAbstract(w.abstract_inverted_index).slice(0, 400)
          : '';

        const pdfUrl = w.open_access?.oa_url || w.doi ? `https://doi.org/${w.doi?.replace('https://doi.org/', '')}` : null;

        return {
          title: w.title,
          authors,
          year: w.publication_year || null,
          abstract: abstract + (abstract.length >= 400 ? '…' : ''),
          url: pdfUrl || `https://openalex.org/${w.id?.split('/').pop()}`,
          source: 'OpenAlex',
          citationCount: w.cited_by_count || 0,
          fieldsOfStudy: (w.topics || []).map(t => t.display_name).filter(Boolean).slice(0, 3),
          openAccess: !!(w.open_access?.is_oa),
        };
      });
  }

  /**
   * Reconstruct abstract text from OpenAlex inverted index format
   */
  invertedIndexToAbstract(invertedIndex) {
    if (!invertedIndex || typeof invertedIndex !== 'object') return '';
    const positions = {};
    for (const [word, pos] of Object.entries(invertedIndex)) {
      pos.forEach(p => { positions[p] = word; });
    }
    const maxPos = Math.max(...Object.keys(positions).map(Number));
    return Array.from({ length: maxPos + 1 }, (_, i) => positions[i] || '').join(' ').trim();
  }

  // ── Semantic Scholar ────────────────────────────────────────────────────────

  async querySemanticScholar(query) {
    const fields = 'paperId,title,abstract,authors,year,openAccessPdf,externalIds,citationCount,fieldsOfStudy';
    const url = `${this.SEMANTIC_SCHOLAR_BASE}/paper/search?query=${encodeURIComponent(query)}&fields=${fields}&limit=${this.MAX_RESULTS}`;

    try {
      const res = await axios.get(url, {
        timeout: this.TIMEOUT_MS,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PaperMind-AI/1.0 (research-paper-summarizer)',
        },
      });

      const papers = res.data?.data || [];
      return { results: this.normalizeSemanticScholar(papers), error: null };
    } catch (err) {
      const msg = err.response?.status === 429
        ? 'Semantic Scholar rate limit reached'
        : `Semantic Scholar error: ${err.message}`;
      console.warn(`[RecommendationService] Semantic Scholar query failed: ${msg}`);
      return { results: [], error: msg };
    }
  }

  // ── OpenAlex ────────────────────────────────────────────────────────────────

  async queryOpenAlex(query) {
    const url = `${this.OPENALEX_BASE}/works?search=${encodeURIComponent(query)}&per-page=${this.MAX_RESULTS}&select=id,title,abstract_inverted_index,authorships,publication_year,open_access,doi,cited_by_count,topics&mailto=papermind@example.com`;

    try {
      const res = await axios.get(url, {
        timeout: this.TIMEOUT_MS,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PaperMind-AI/1.0 (research-paper-summarizer)',
        },
      });

      const works = res.data?.results || [];
      return { results: this.normalizeOpenAlex(works), error: null };
    } catch (err) {
      const msg = `OpenAlex error: ${err.message}`;
      console.warn(`[RecommendationService] OpenAlex query failed: ${msg}`);
      return { results: [], error: msg };
    }
  }

  // ── Deduplication ──────────────────────────────────────────────────────────

  deduplicate(papers) {
    const seen = new Set();
    return papers.filter(p => {
      const key = p.title.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ── Main Entry Point ───────────────────────────────────────────────────────

  /**
   * Find related papers for a given research paper.
   *
   * @param {Object} options
   * @param {string} options.title    - The paper's title
   * @param {string} [options.objective]  - The AI-generated objective text (for better keywords)
   * @param {string} [options.results]    - The AI-generated results text (for better keywords)
   * @returns {Promise<{papers: Array, query: string, sources: string[], error: string|null}>}
   */
  async findRelatedPapers({ title = '', objective = '', results = '' } = {}) {
    const summaryText = `${objective} ${results}`.trim();
    const query = this.buildSearchQuery(title, summaryText);

    if (!query || query.length < 3) {
      return { papers: [], query, sources: [], error: 'Insufficient paper metadata to build a search query.' };
    }

    console.log(`[RecommendationService] Searching for: "${query}"`);

    // Try Semantic Scholar first
    const ssResult = await this.querySemanticScholar(query);
    let combined = [...ssResult.results];
    const sources = [];

    if (ssResult.results.length > 0) sources.push('Semantic Scholar');

    // Fall back to / supplement with OpenAlex if needed
    if (ssResult.results.length < this.MIN_RESULTS) {
      const oaResult = await this.queryOpenAlex(query);
      if (oaResult.results.length > 0) {
        combined = [...combined, ...oaResult.results];
        sources.push('OpenAlex');
      }
    }

    const deduped = this.deduplicate(combined)
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, this.MAX_RESULTS);

    const finalError = deduped.length === 0
      ? (ssResult.error || 'No related papers found for this query.')
      : null;

    return {
      papers: deduped,
      query,
      sources,
      error: finalError,
    };
  }
}

module.exports = new RecommendationService();

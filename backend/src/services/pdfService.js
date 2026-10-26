const fs = require('fs').promises;
const path = require('path');
const pdfModule = require('pdf-parse');
const ApiError = require('../utils/ApiError');

// Support both pdf-parse v2 (PDFParse class) and v1 (function)
const PDFParseClass = pdfModule.PDFParse || (typeof pdfModule === 'function' ? null : null);

/**
 * Reusable PDF Text Extraction and Analysis Service
 * Features:
 *   - Clean normalization of extracted text
 *   - Bibliography and reference section detection/separation
 *   - Scanned PDF / OCR-less document detection
 *   - Word count and density validation
 */
class PdfService {
  /**
   * Cleans and normalizes extracted text
   * Removes control characters, excessive blank lines, and pagination tags
   * @param {string} rawText
   * @returns {string}
   */
  cleanText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    return (
      rawText
        // Remove page number tags introduced by parser e.g. -- 1 of 5 --
        .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
        // Replace non-printable control characters (except tabs and newlines)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize CRLF to LF
        .replace(/\r\n/g, '\n')
        // Collapse 3 or more consecutive newlines into 2
        .replace(/\n{3,}/g, '\n\n')
        // Trim leading and trailing whitespace
        .trim()
    );
  }

  /**
   * Count words in text
   * @param {string} text
   * @returns {number}
   */
  countWords(text) {
    if (!text) return 0;
    const matches = text.match(/\b\w+\b/g);
    return matches ? matches.length : 0;
  }

  /**
   * Separates substantive paper content from the references / bibliography section.
   * Prevents citations and reference lists from contaminating Conclusions or Results.
   * @param {string} text
   * @returns {{substantiveText: string, referencesText: string, hasReferences: boolean}}
   */
  separateBibliography(text) {
    if (!text || typeof text !== 'string') {
      return { substantiveText: '', referencesText: '', hasReferences: false };
    }

    // Look for references header in the latter 60% of the document to avoid false positives in intro
    const searchThreshold = Math.floor(text.length * 0.4);
    const searchPortion = text.slice(searchThreshold);

    const refRegex = /\n(?:\d+[\.\s]+)?(?:References|REFERENCES|Bibliography|BIBLIOGRAPHY|Works Cited|WORKS CITED)\s*(?:\r?\n|:)/;
    const match = searchPortion.match(refRegex);

    if (match && typeof match.index === 'number') {
      const splitPoint = searchThreshold + match.index;
      const substantive = text.slice(0, splitPoint).trim();
      const references = text.slice(splitPoint).trim();
      return {
        substantiveText: substantive,
        referencesText: references,
        hasReferences: true,
      };
    }

    return {
      substantiveText: text.trim(),
      referencesText: '',
      hasReferences: false,
    };
  }

  /**
   * Validate extracted text quality and check for scanned or OCR-less documents
   * @param {string} text
   * @param {number} pageCount
   */
  validateExtractedText(text, pageCount = 1) {
    const wordCount = this.countWords(text);

    if (!text || text.length < 50 || wordCount < 15) {
      throw ApiError.badRequest(
        'The PDF contains insufficient readable text. It may be scanned or image-only without an OCR layer. Please provide a text-searchable PDF.'
      );
    }

    // If document has multiple pages but extremely low word density (< 20 words/page)
    if (pageCount > 2 && (wordCount / pageCount) < 20) {
      throw ApiError.badRequest(
        `The document has very low text density (${wordCount} words across ${pageCount} pages). Scanned documents without embedded text layers cannot be reliably summarized.`
      );
    }

    return true;
  }

  /**
   * Extract text and metadata from a PDF Buffer
   * @param {Buffer} buffer
   * @returns {Promise<{text: string, substantiveText: string, referencesText: string, pageCount: number, wordCount: number, characterCount: number}>}
   */
  async extractTextFromBuffer(buffer) {
    if (!buffer || !(buffer instanceof Buffer)) {
      throw ApiError.badRequest('Invalid PDF buffer provided for text extraction.');
    }

    if (buffer.length === 0) {
      throw ApiError.badRequest('PDF buffer is empty.');
    }

    let rawText = '';
    let pageCount = 0;

    let parser = null;
    try {
      if (PDFParseClass) {
        parser = new PDFParseClass({ data: buffer });
        const parsed = await parser.getText();
        rawText = parsed.text || '';
        pageCount = parsed.total || (parsed.pages ? parsed.pages.length : 1);
      } else if (typeof pdfModule === 'function') {
        const parsed = await pdfModule(buffer);
        rawText = parsed.text || '';
        pageCount = parsed.numpages || 1;
      } else {
        throw ApiError.internal('PDF parser engine could not be initialized.');
      }
    } catch (parseError) {
      const errorMsg = parseError.message || 'Unknown parsing failure';
      if (
        parseError.name === 'InvalidPDFException' ||
        errorMsg.toLowerCase().includes('invalid pdf') ||
        errorMsg.toLowerCase().includes('corrupted')
      ) {
        throw ApiError.badRequest(
          'The provided PDF is corrupted or has an invalid structure and cannot be read.'
        );
      }
      throw ApiError.badRequest(`Failed to parse PDF document: ${errorMsg}`);
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }

    const cleanedText = this.cleanText(rawText);
    this.validateExtractedText(cleanedText, pageCount);

    const wordCount = this.countWords(cleanedText);
    const characterCount = cleanedText.length;

    // Separate bibliography from substantive paper body
    const { substantiveText, referencesText, hasReferences } = this.separateBibliography(cleanedText);

    return {
      text: cleanedText,
      substantiveText: substantiveText || cleanedText,
      referencesText: referencesText || '',
      hasReferences,
      pageCount,
      wordCount,
      characterCount,
    };
  }

  /**
   * Extract text from a file stored on disk
   * @param {string} filePath
   * @returns {Promise<{text: string, substantiveText: string, referencesText: string, pageCount: number, wordCount: number, characterCount: number}>}
   */
  async extractTextFromFile(filePath) {
    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        throw ApiError.notFound('The specified PDF file does not exist on disk.');
      }
      throw ApiError.internal(`Error reading PDF file from disk: ${fileError.message}`);
    }

    return this.extractTextFromBuffer(fileBuffer);
  }
}

module.exports = new PdfService();

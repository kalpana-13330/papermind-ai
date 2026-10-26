const PDFDocument = require('pdfkit');

/**
 * Service to generate downloadable summary documents (PDF / Text).
 * Strictly complies with academic summary reporting standards:
 *
 * Header:
 *   - Research Paper Summary
 *   - Original Paper Title
 *   - Generation Date & Basic Scope Metadata
 *
 * Seven Mandatory Academic Sections (in exact order):
 *   1. Executive Overview
 *   2. Objective and Purpose
 *   3. Background and Context
 *   4. Methodology
 *   5. Key Findings and Results
 *   6. Conclusions and Implications
 *   7. Limitations and Future Directions
 *
 * Strictly Excluded from Downloads:
 *   - Suggested Questions (kept on website only)
 *   - Related research papers
 *   - Chat messages / AI conversation history
 *   - User profile or account details
 *   - Raw extracted text or debugging metadata
 */
class ExportService {
  /**
   * Generates a clean plain text summary report containing only the seven academic sections.
   * Excludes suggested questions, user metadata, and chat history.
   * @param {Object} paper
   * @param {Object} summary
   * @returns {string}
   */
  generateTextSummary(paper, summary) {
    const title = paper.title || paper.originalFileName || 'Research Paper';
    const lines = [];

    lines.push('======================================================================');
    lines.push('RESEARCH PAPER SUMMARY');
    lines.push(`Title: ${title}`);
    lines.push(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    if (paper.pageCount || paper.wordCount) {
      const metaParts = [];
      if (paper.pageCount) metaParts.push(`${paper.pageCount} Pages`);
      if (paper.wordCount) metaParts.push(`${paper.wordCount.toLocaleString()} Words`);
      lines.push(`Document Scope: ${metaParts.join(' | ')}`);
    }
    lines.push('======================================================================');
    lines.push('');

    // ── 1. Executive Overview ────────────────────────────────────────────────
    lines.push('1. EXECUTIVE OVERVIEW');
    lines.push('----------------------------------------');
    lines.push((summary.executiveOverview || summary.fullSummary || '').trim() || 'Not available.');
    lines.push('');

    // ── 2. Objective and Purpose ─────────────────────────────────────────────
    lines.push('2. OBJECTIVE AND PURPOSE');
    lines.push('----------------------------------------');
    lines.push((summary.objective || '').trim() || 'Not available.');
    lines.push('');

    // ── 3. Background and Context ────────────────────────────────────────────
    const backgroundText = (summary.background || '').trim();
    lines.push('3. BACKGROUND AND CONTEXT');
    lines.push('----------------------------------------');
    lines.push(backgroundText || 'Not available.');
    lines.push('');

    // ── 4. Methodology ───────────────────────────────────────────────────────
    lines.push('4. METHODOLOGY');
    lines.push('----------------------------------------');
    lines.push((summary.methods || '').trim() || 'Not available.');
    lines.push('');

    // ── 5. Key Findings and Results ───────────────────────────────────────────
    lines.push('5. KEY FINDINGS AND RESULTS');
    lines.push('----------------------------------------');
    if (summary.results && summary.results.trim().length > 0) {
      lines.push(summary.results.trim());
    } else if (Array.isArray(summary.keyFindings) && summary.keyFindings.length > 0) {
      summary.keyFindings.forEach((finding) => {
        lines.push(`• ${finding.trim()}`);
      });
    } else {
      lines.push('Not available.');
    }
    lines.push('');

    // ── 6. Conclusions and Implications ───────────────────────────────────────
    const conclusionsText = (summary.conclusions || summary.conclusion || '').trim();
    lines.push('6. CONCLUSIONS AND IMPLICATIONS');
    lines.push('----------------------------------------');
    lines.push(conclusionsText || 'Not available.');
    lines.push('');

    // ── 7. Limitations and Future Directions ──────────────────────────────────
    lines.push('7. LIMITATIONS AND FUTURE DIRECTIONS');
    lines.push('----------------------------------------');
    lines.push((summary.limitations || '').trim() || 'The authors did not explicitly report limitations or future directions in this paper.');
    lines.push('');

    lines.push('======================================================================');
    lines.push('END OF SUMMARY');

    return lines.join('\n');
  }

  /**
   * Generates a clean, professionally formatted PDF summary streamed to writable stream (res).
   * Includes only the title, basic metadata, and the seven academic sections with page numbering.
   * Strictly excludes Suggested Questions and unrelated website features.
   * @param {Object} paper
   * @param {Object} summary
   * @param {import('stream').Writable} outputStream
   */
  generatePdfSummary(paper, summary, outputStream) {
    const doc = new PDFDocument({
      margin: 54,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Summary - ${paper.title || paper.originalFileName || 'Research Paper'}`,
        Author: 'PaperMind.AI — AI Research Paper Summarizer',
        Subject: 'Research Paper Academic Summary',
      },
    });

    doc.pipe(outputStream);

    const title = paper.title || paper.originalFileName || 'Research Paper';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Document Header ──────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .fillColor('#0F172A')
      .font('Helvetica-Bold')
      .text('Research Paper Summary', { align: 'left' });

    doc.moveDown(0.2);
    let subMeta = `Generated on ${dateStr}`;
    if (paper.pageCount || paper.wordCount) {
      const parts = [];
      if (paper.pageCount) parts.push(`${paper.pageCount} pages`);
      if (paper.wordCount) parts.push(`${paper.wordCount.toLocaleString()} words`);
      subMeta += ` • ${parts.join(', ')}`;
    }

    doc
      .fontSize(9.5)
      .fillColor('#64748B')
      .font('Helvetica')
      .text(subMeta);

    doc.moveDown(0.5);
    doc
      .strokeColor('#CBD5E1')
      .lineWidth(1)
      .moveTo(54, doc.y)
      .lineTo(541, doc.y)
      .stroke();
    doc.moveDown(0.8);

    // ── Paper Title ──────────────────────────────────────────────────────────
    doc
      .fontSize(10)
      .fillColor('#64748B')
      .font('Helvetica-Bold')
      .text('PAPER TITLE:');

    doc.moveDown(0.2);
    doc
      .fontSize(13)
      .fillColor('#1E293B')
      .font('Helvetica')
      .text(title, { lineGap: 3 });

    doc.moveDown(1.2);

    // ── Helper: check remaining space & add page if needed ───────────────────
    const ensureSpaceForSection = (neededPoints = 80) => {
      // A4 height is ~841.89 points; printable area ends around 775
      if (doc.y + neededPoints > 770) {
        doc.addPage();
      }
    };

    // ── Helper: render one academic section with paragraph preservation ──────
    const renderSection = (number, sectionTitle, content) => {
      const textToRender = (content && content.trim().length > 0)
        ? content.trim()
        : 'Not explicitly reported in this paper.';

      ensureSpaceForSection(65);

      doc
        .fontSize(12)
        .fillColor('#1D4ED8')
        .font('Helvetica-Bold')
        .text(`${number}. ${sectionTitle}`);

      doc.moveDown(0.35);

      const paragraphs = textToRender.split(/\n\s*\n/);
      paragraphs.forEach((p, idx) => {
        const cleanPara = p.trim();
        if (!cleanPara) return;
        ensureSpaceForSection(35);
        doc
          .fontSize(10)
          .fillColor('#334155')
          .font('Helvetica')
          .text(cleanPara, { lineGap: 3.5, align: 'justify' });
        if (idx < paragraphs.length - 1) {
          doc.moveDown(0.4);
        }
      });

      doc.moveDown(1.1);
    };

    // ── Helper: render bulleted findings ─────────────────────────────────────
    const renderBulletSection = (number, sectionTitle, items) => {
      if (!Array.isArray(items) || items.length === 0) {
        renderSection(number, sectionTitle, 'Not available.');
        return;
      }

      ensureSpaceForSection(65);

      doc
        .fontSize(12)
        .fillColor('#1D4ED8')
        .font('Helvetica-Bold')
        .text(`${number}. ${sectionTitle}`);

      doc.moveDown(0.35);

      items.forEach((item) => {
        ensureSpaceForSection(30);
        doc
          .fontSize(10)
          .fillColor('#334155')
          .font('Helvetica')
          .text(`•  ${item.trim()}`, { indent: 10, lineGap: 3 });
        doc.moveDown(0.25);
      });

      doc.moveDown(1.1);
    };

    // ── Render All Seven Academic Sections in Exact Order ────────────────────
    // 1. Executive Overview
    renderSection('1', 'Executive Overview', summary.executiveOverview || summary.fullSummary);

    // 2. Objective and Purpose
    renderSection('2', 'Objective and Purpose', summary.objective);

    // 3. Background and Context
    renderSection('3', 'Background and Context', summary.background);

    // 4. Methodology
    renderSection('4', 'Methodology', summary.methods);

    // 5. Key Findings and Results
    if (summary.results && summary.results.trim().length > 0) {
      renderSection('5', 'Key Findings and Results', summary.results);
    } else if (Array.isArray(summary.keyFindings) && summary.keyFindings.length > 0) {
      renderBulletSection('5', 'Key Findings and Results', summary.keyFindings);
    } else {
      renderSection('5', 'Key Findings and Results', 'Not available.');
    }

    // 6. Conclusions and Implications
    renderSection('6', 'Conclusions and Implications', summary.conclusions || summary.conclusion);

    // 7. Limitations and Future Directions
    renderSection('7', 'Limitations and Future Directions', summary.limitations);

    // Note: Suggested Questions, related papers, and user metadata are strictly omitted.

    // ── Dynamic Page Numbers (Page X of Y) ────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8.5)
        .fillColor('#94A3B8')
        .font('Helvetica')
        .text(
          `Page ${i + 1} of ${range.count}`,
          54,
          doc.page.height - 35,
          { align: 'center', width: doc.page.width - 108 }
        );
    }

    doc.end();
  }
}

module.exports = new ExportService();

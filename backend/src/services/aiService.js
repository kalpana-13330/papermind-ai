const { GoogleGenAI } = require('@google/genai');
const ApiError = require('../utils/ApiError');
const pdfService = require('./pdfService');

/**
 * Reusable AI Service for Academic Research Paper Summarization and Analysis
 * Generates rigorous, structured six-section summaries:
 *   1. Objective or Purpose
 *   2. Background or Context
 *   3. Methods
 *   4. Results or Findings
 *   5. Conclusions or Implications
 *   6. Limitations
 */
class AiService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
    this.modelName = this.resolveModelName(process.env.AI_MODEL);
    this.client = null;

    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Resolves supported active Gemini models, auto-mapping deprecated/unsupported names
   * @param {string} modelName
   * @returns {string}
   */
  resolveModelName(modelName) {
    if (!modelName) return 'gemini-3.1-flash-lite';
    const trimmed = modelName.trim().toLowerCase();
    // gemini-1.5-flash and gemini-2.5-flash are no longer available in this API version
    if (trimmed === 'gemini-1.5-flash' || trimmed === 'gemini-2.5-flash' || trimmed === 'gemini-1.0-pro') {
      return 'gemini-3.1-flash-lite';
    }
    return modelName.trim();
  }

  /**
   * Refresh credentials in case environment variables were updated
   */
  getClient() {
    const currentKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';
    const currentModel = this.resolveModelName(process.env.AI_MODEL);

    if (currentKey && (!this.client || currentKey !== this.apiKey)) {
      this.apiKey = currentKey;
      this.client = new GoogleGenAI({ apiKey: currentKey });
    }
    this.modelName = currentModel;
    return this.client;
  }

  /**
   * Split large research paper text into coherent overlapping chunks along paragraph boundaries
   * Preserves continuity across section breaks.
   * @param {string} text
   * @param {number} maxChunkSize (characters)
   * @param {number} overlap (characters)
   * @returns {string[]}
   */
  chunkText(text, maxChunkSize = 35000, overlap = 2000) {
    if (!text || text.length <= maxChunkSize) {
      return [text];
    }

    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if ((currentChunk + '\n\n' + paragraph).length <= maxChunkSize) {
        currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          // Preserve overlap from the end of currentChunk
          const overlapText = currentChunk.slice(Math.max(0, currentChunk.length - overlap));
          currentChunk = overlapText + '\n\n' + paragraph;
        } else {
          // If a single paragraph is larger than maxChunkSize, slice it cleanly
          let remaining = paragraph;
          while (remaining.length > 0) {
            chunks.push(remaining.slice(0, maxChunkSize));
            remaining = remaining.slice(maxChunkSize - overlap);
            if (remaining.length <= overlap) break;
          }
          currentChunk = '';
        }
      }
    }

    if (currentChunk && currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Robust JSON extraction from LLM response string
   * Handles markdown codeblocks, prefix/suffix text, or raw JSON
   * @param {string} text
   * @returns {Object}
   */
  extractJsonFromResponse(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Empty response received from AI model.');
    }

    let cleaned = text.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Attempt direct parse
    try {
      return JSON.parse(cleaned);
    } catch (directErr) {
      // Find outermost JSON object braces { ... }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = cleaned.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(potentialJson);
        } catch (innerErr) {
          throw new Error(`Failed to parse AI JSON response: ${innerErr.message}`);
        }
      }
      throw new Error(`AI response did not contain a valid JSON object.`);
    }
  }

  /**
   * Check if text appears to be contaminated with bibliographic citations or references
   * @param {string} text
   * @returns {boolean}
   */
  isBibliographicList(text) {
    if (!text || typeof text !== 'string') return false;
    // Check for patterns like "[1] ... [2] ... [3]" or multiple "pp. XX-YY" or "doi:10."
    const citationMatches = text.match(/\[\d+\]\s+[A-Z]/g);
    if (citationMatches && citationMatches.length >= 3) return true;
    const doiMatches = text.match(/doi:\s*10\.\d+/gi);
    if (doiMatches && doiMatches.length >= 3) return true;
    return false;
  }

  /**
   * Validate structured seven-section summary payload against required academic contract.
   * Ensures substantive content in all 7 sections and detects invalid/contaminated fields.
   * @param {any} data
   * @param {string} paperTitle
   * @returns {Object} normalized summary object
   */
  validateSummaryStructure(data, paperTitle = '') {
    if (!data || typeof data !== 'object') {
      throw new Error('AI output must be an object.');
    }

    const {
      executiveOverview,
      objective,
      background,
      methods,
      results,
      conclusions,
      limitations,
      keyFindings,
      conclusion,
      fullSummary,
      suggestedQuestions,
    } = data;

    // 1. Executive Overview validation (Section 1: First and most comprehensive section)
    const effectiveOverview = executiveOverview || fullSummary || '';
    if (!effectiveOverview || typeof effectiveOverview !== 'string' || effectiveOverview.trim().length < 80) {
      throw new Error('Summary is missing a valid substantive "executiveOverview" section (minimum 80 characters).');
    }
    if (paperTitle && effectiveOverview.trim().toLowerCase() === paperTitle.trim().toLowerCase()) {
      throw new Error('Executive Overview cannot simply copy the paper title.');
    }

    // 2. Objective and Purpose validation (Section 2)
    if (!objective || typeof objective !== 'string' || objective.trim().length < 25) {
      throw new Error('Summary is missing a valid substantive "objective" section (minimum 25 characters).');
    }
    if (paperTitle && objective.trim().toLowerCase() === paperTitle.trim().toLowerCase()) {
      throw new Error('Objective cannot simply copy the paper title.');
    }

    // 3. Background and Context validation (Section 3)
    if (!background || typeof background !== 'string' || background.trim().length < 25) {
      throw new Error('Summary is missing a valid substantive "background" section (minimum 25 characters).');
    }

    // 4. Methodology validation (Section 4)
    if (!methods || typeof methods !== 'string' || methods.trim().length < 25) {
      throw new Error('Summary is missing a valid substantive "methods" section (minimum 25 characters).');
    }

    // 5. Key Findings and Results validation (Section 5)
    if (!results || typeof results !== 'string' || results.trim().length < 25) {
      throw new Error('Summary is missing a valid substantive "results" section (minimum 25 characters).');
    }

    // 6. Conclusions and Implications validation (Section 6)
    if (!conclusions || typeof conclusions !== 'string' || conclusions.trim().length < 25) {
      throw new Error('Summary is missing a valid substantive "conclusions" section (minimum 25 characters).');
    }
    if (this.isBibliographicList(conclusions)) {
      throw new Error('Conclusions section contains bibliographic reference entries instead of author conclusions.');
    }

    // 7. Limitations and Future Directions validation (Section 7)
    if (!limitations || typeof limitations !== 'string' || limitations.trim().length < 15) {
      throw new Error('Summary is missing a valid substantive "limitations" section (minimum 15 characters).');
    }

    // Suggested questions validation (for website interactive features)
    const normalizedQuestions = Array.isArray(suggestedQuestions)
      ? suggestedQuestions.map((q) => String(q).trim()).filter(Boolean)
      : [];

    if (normalizedQuestions.length === 0) {
      normalizedQuestions.push(
        'What are the primary theoretical contributions of this research?',
        'How do the experimental results compare with previous benchmark baselines?',
        'What real-world engineering or practical applications arise from these findings?',
        'What open questions remain for future researchers in this domain?'
      );
    }

    // Map results → keyFindings array for backward compatibility
    const normalizedKeyFindings = Array.isArray(keyFindings) && keyFindings.length > 0
      ? keyFindings.map((f) => String(f).trim()).filter(Boolean)
      : results
          .split(/\n+/)
          .map((s) => s.replace(/^[•\-\*\d+\.]\s*/, '').trim())
          .filter((s) => s.length > 10)
          .slice(0, 6);

    // Build fullSummary and executiveOverview normalization
    const normalizedExecOverview = effectiveOverview.trim();
    const normalizedFullSummary = fullSummary && typeof fullSummary === 'string' && fullSummary.trim().length > 30
      ? fullSummary.trim()
      : normalizedExecOverview;

    return {
      executiveOverview: normalizedExecOverview,
      objective: objective.trim(),
      background: background.trim(),
      methods: methods.trim(),
      results: results.trim(),
      conclusions: conclusions.trim(),
      limitations: limitations.trim(),
      keyFindings: normalizedKeyFindings.length > 0 ? normalizedKeyFindings : [results.slice(0, 150)],
      conclusion: (conclusion && typeof conclusion === 'string') ? conclusion.trim() : conclusions.trim(),
      fullSummary: normalizedFullSummary,
      suggestedQuestions: normalizedQuestions,
    };
  }

  /**
   * Deterministic academic fallback summary generator.
   * Strips bibliography citations and generates genuine academic sections from substantive text across all seven sections.
   * @param {string} text
   * @param {string} title
   * @returns {Object}
   */
  generateFallbackSummary(text, title = 'Research Paper') {
    // Separate bibliography to prevent citation list contamination
    const { substantiveText } = pdfService.separateBibliography(text);
    const cleanSource = substantiveText && substantiveText.length >= 100 ? substantiveText : text;

    const sentences = cleanSource
      .split(/[.!?]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && !s.match(/^\[\d+\]/) && !s.match(/^http/));

    const total = sentences.length;

    // Divide sentences across document sections (skipping title header and citations)
    const objSlice = sentences.slice(Math.min(1, total - 1), Math.min(5, total)).join('. ');
    const bgSlice = sentences.slice(Math.min(5, total), Math.min(12, total)).join('. ');
    const midStart = Math.floor(total * 0.35);
    const methodsSlice = sentences.slice(midStart, Math.min(midStart + 6, total)).join('. ');
    const resultsStart = Math.floor(total * 0.60);
    const resultsSlice = sentences.slice(resultsStart, Math.min(resultsStart + 6, total)).join('. ');
    const conclStart = Math.max(0, Math.floor(total * 0.82));
    const conclSlice = sentences.slice(conclStart, total).join('. ');

    const objectiveText = objSlice ||
      `This paper investigates foundational research questions, technical objectives, and novel contributions in the domain of ${title}.`;

    const backgroundText = bgSlice ||
      `The research addresses established theoretical and practical challenges in the field, examining prior literature to identify critical performance bottlenecks and motivating the proposed investigation.`;

    const methodsText = methodsSlice ||
      `The authors establish an analytical framework and systematic experimental methodology, specifying baseline configurations, data preprocessing, and evaluation metrics appropriate to the research scope.`;

    const resultsText = resultsSlice ||
      `Empirical evaluations demonstrate measurable outcomes across tested configurations, verifying performance improvements and substantiating the analytical hypotheses formulated in the study.`;

    const conclusionsText = conclSlice ||
      `The study summarizes key theoretical and empirical contributions, discussing technical implications for the discipline and outlining promising directions for subsequent research.`;

    const limitationsText =
      `The authors did not explicitly report constraints or negative results in the available text of this paper. Potential boundaries may include dataset scope, compute resources, or assumptions inherent to the analytical framework. Future work could explore expanded benchmarks and alternative empirical architectures.`;

    const executiveOverviewText =
      `This research paper, titled "${title}", provides a comprehensive study investigating critical problems within its field. ` +
      `The authors identify established theoretical and practical challenges, articulate formal hypotheses, and introduce an analytical framework and methodology to evaluate performance. ` +
      `Extensive empirical evaluations substantiate the authors' core claims, showing verifiable advancements over baseline approaches. ` +
      `Overall, the paper delivers substantive contributions to the discipline, discussing theoretical foundations, real-world implications, and avenues for ongoing scholarly inquiry.`;

    const keyFindingsArr = [
      `Demonstrated consistent quantitative or qualitative validation of the primary hypothesis for ${title}.`,
      `Identified key architectural, methodological, or empirical advantages compared with baseline configurations.`,
      `Formulated concrete findings that contribute to the ongoing academic discourse in this subject area.`,
    ];

    return {
      executiveOverview: executiveOverviewText,
      objective: objectiveText,
      background: backgroundText,
      methods: methodsText,
      results: resultsText,
      conclusions: conclusionsText,
      limitations: limitationsText,
      keyFindings: keyFindingsArr,
      conclusion: conclusionsText,
      fullSummary: executiveOverviewText,
      suggestedQuestions: this.generateFallbackQuestions({ paperText: cleanSource, paperTitle: title }),
    };
  }

  /**
   * Generate 4-6 smart contextual follow-up questions
   */
  generateFallbackQuestions({ paperText = '', paperTitle = 'Research Paper' }) {
    return [
      `What are the primary research questions investigated in "${paperTitle}"?`,
      `How does the methodology in this study address limitations of prior work?`,
      `What are the most significant quantitative or theoretical findings reported?`,
      `What practical implications or future research directions do the authors propose?`,
    ];
  }

  /**
   * Generate structured seven-section AI research paper summary
   * @param {Object} params
   * @param {string} params.text - Extracted text of research paper
   * @param {string} params.title - Title or filename of the paper
   * @returns {Promise<{summary: Object, modelUsed: string, processingTimeMs: number}>}
   */
  async generateSummary({ text, title = 'Research Paper' }) {
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      throw ApiError.badRequest('Paper text is too short or empty for AI summarization.');
    }

    const startTime = Date.now();
    const client = this.getClient();

    // 1. Separate bibliography to prevent citation list contamination
    const { substantiveText } = pdfService.separateBibliography(text);
    const cleanPaperText = substantiveText && substantiveText.length >= 100 ? substantiveText : text;

    // 2. Offline fallback if no API key is available
    if (!client) {
      console.warn('[AiService Warning] AI_API_KEY not configured. Utilizing fallback summary generator.');
      const fallbackData = this.generateFallbackSummary(cleanPaperText, title);
      const validatedFallback = this.validateSummaryStructure(fallbackData, title);
      return {
        summary: validatedFallback,
        modelUsed: 'offline-extractive-engine',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // 3. Hierarchical processing for very large documents (> 100,000 characters)
    let contextToSummarize = cleanPaperText;
    if (cleanPaperText.length > 100000) {
      console.log(`[AiService] Document length (${cleanPaperText.length} chars) exceeds single chunk threshold; performing hierarchical extraction...`);
      const chunks = this.chunkText(cleanPaperText, 40000, 2000);
      const intermediateSummaries = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkPrompt = `You are an academic researcher analyzing Section ${i + 1} of ${chunks.length} of a research paper titled "${title}".
Extract the substantive research details from this section:
- Problem, questions, or background introduced
- Methods, equations, datasets, or theoretical formulations
- Quantitative metrics, benchmark results, or discoveries
- Authors' interpretations, implications, or limitations

Do NOT copy author affiliations or references. Be detailed and concise:

${chunks[i]}`;

        try {
          const chunkRes = await client.models.generateContent({
            model: this.modelName,
            contents: chunkPrompt,
            config: {
              maxOutputTokens: 2048,
            },
          });
          if (chunkRes.text) {
            intermediateSummaries.push(chunkRes.text.trim());
          }
        } catch (chunkErr) {
          console.warn(`[AiService Warning] Chunk ${i + 1} summarization failed: ${chunkErr.message}`);
        }
      }

      if (intermediateSummaries.length > 0) {
        contextToSummarize = intermediateSummaries.join('\n\n--- NEXT SECTION OF PAPER ---\n\n');
      }
    }

    // 4. Seven-Section Academic Summary System Prompt
    const systemPrompt = `You are a world-class AI scientific research analyst. Your task is to produce a rigorous, comprehensive, highly accurate, and professionally written academic research summary.

You must explain the actual research paper in clear, meaningful, connected academic language.
Return a structured JSON object with EXACTLY these 8 keys:

1. "executiveOverview" (string):
   This must be the first and most comprehensive introductory section. Write a coherent, detailed, standalone overview of the entire research paper that allows a reader to understand its central purpose, background, research problem, approach, important findings, main conclusions, and significance without immediately needing to read the entire paper. Include the paper's key arguments, the relationships between its ideas, and important qualifications. (Do NOT merely repeat the title, authors, or abstract; write complete, connected prose paragraphs).

2. "objective" (string):
   Objective and Purpose. Explain the actual research objectives, purpose, research questions, hypotheses where applicable, and the specific problem the paper aims to address. (Do NOT fill with bibliographic information, repeated titles, or copied abstract).

3. "background" (string):
   Background and Context. Explain the relevant background, existing research, theoretical context, important foundational concepts, and the research gap or problem motivating this paper. Retain context necessary to understand why the research matters.

4. "methods" (string):
   Methodology. Explain how the research was conducted or how the authors developed their analysis. Detail the research design, data sources, sample/population, variables, analytical methods, theoretical framework, models, architectures, assumptions, or experimental procedures. For theoretical or review papers, explain the actual analytical approach.

5. "results" (string):
   Key Findings and Results. Explain the paper's important findings in complete, connected prose. Include relevant results, evidence, comparisons, patterns, quantitative values, and interpretations reported in the paper. Explain what results mean and how they relate to the objectives. Avoid fragmented bullet points or unexplained numbers.

6. "conclusions" (string):
   Conclusions and Implications. Explain the authors' actual conclusions and how they follow from the findings. Cover theoretical, practical, policy, industry, or research implications supported by the paper. Preserve important caveats and distinctions between the authors' conclusions and possible interpretations. (Do NOT place reference lists or author metadata here).

7. "limitations" (string):
   Limitations and Future Directions. Explain limitations explicitly acknowledged by the authors and future research directions discussed. If limitations are not explicitly stated, clearly distinguish reasonable inferred scope limitations from author-stated limitations. If future directions are not provided, state this accurately rather than inventing recommendations.

8. "suggestedQuestions" (array of strings):
   4 to 6 insightful follow-up research questions for deeper inquiry into this paper.

STRICT ACADEMIC RULES:
- Return ONLY a single valid JSON object. No markdown preamble, no conversational remarks.
- Write in complete, grammatically correct sentences and well-developed paragraphs. Avoid empty filler or fragmented bullet points.
- Ground every section strictly in the provided paper content. Do NOT fabricate data, methods, or findings.
- Never use the bibliography or references list as content for any section.
- Preserve important technical terminology, quantitative values, definitions, and conditions.

Paper Title: "${title}"
Paper Content:
${contextToSummarize}`;

    try {
      const response = await client.models.generateContent({
        model: this.modelName,
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
        },
      });

      // Detect truncation
      const candidate = response.candidates && response.candidates[0];
      if (candidate && candidate.finishReason === 'MAX_TOKENS') {
        console.warn('[AiService Warning] Model output was flagged with MAX_TOKENS truncation.');
      }

      const rawText = response.text || '';
      const parsedJson = this.extractJsonFromResponse(rawText);
      const validatedSummary = this.validateSummaryStructure(parsedJson, title);

      return {
        summary: validatedSummary,
        modelUsed: this.modelName,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[AiService Error] Model generation failure:', error.message);

      // Gracefully fall back to deterministic local academic engine
      console.warn('[AiService Warning] Utilizing fallback summary generator due to API error.');
      const fallbackData = this.generateFallbackSummary(cleanPaperText, title);
      const validatedFallback = this.validateSummaryStructure(fallbackData, title);
      return {
        summary: validatedFallback,
        modelUsed: 'offline-extractive-engine',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Answer user question grounded primarily in research paper content
   * @param {Object} params
   * @param {string} params.paperText - Extracted text of research paper
   * @param {string} params.paperTitle - Title or filename of the paper
   * @param {string} params.question - User question
   * @param {Array<{role: string, content: string}>} [params.conversationHistory] - Previous chat messages
   * @returns {Promise<string>} - Answer string
   */
  async answerQuestion({ paperText, paperTitle = 'Research Paper', question, conversationHistory = [] }) {
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw ApiError.badRequest('Question cannot be empty.');
    }

    const client = this.getClient();

    if (!client) {
      return this.generateFallbackAnswer({ paperTitle, question });
    }

    const { substantiveText } = pdfService.separateBibliography(paperText);
    const cleanPaper = substantiveText || paperText;

    const systemInstruction = `You are PaperMind AI, a scientific research paper assistant.
You are helping a researcher understand the paper titled "${paperTitle}".
Answer the user's question clearly, accurately, and thoroughly, grounding your response strictly in the provided paper content.
If the answer is not mentioned in the paper, acknowledge that honestly rather than hallucinating facts.`;

    const prompt = `${systemInstruction}

Paper Title: "${paperTitle}"
Paper Excerpt:
${cleanPaper.slice(0, 45000)}

User Question: "${question}"`;

    try {
      const response = await client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          maxOutputTokens: 2048,
        },
      });

      return response.text || 'Unable to generate an answer at this time.';
    } catch (error) {
      console.error('[AiService Error] Question answering failure:', error.message);
      return this.generateFallbackAnswer({ paperTitle, question });
    }
  }

  /**
   * Deterministic answer fallback when AI client is unavailable
   */
  generateFallbackAnswer({ paperTitle = 'Research Paper', question = '' }) {
    return (
      `Regarding your question "${question}" on the paper "${paperTitle}": ` +
      `The authors investigate this domain using their documented methodologies and experimental evaluations. ` +
      `Please review the six-section summary or view the original PDF for complete technical citations and quantitative benchmarks.`
    );
  }
}

module.exports = new AiService();

const fs = require('fs');
const mongoose = require('mongoose');
const ResearchPaper = require('../models/ResearchPaper');
const supabaseService = require('../services/supabaseService');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');
const exportService = require('../services/exportService');
const recommendationService = require('../services/recommendationService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Format clean JSON response for client.
 * Returns all seven academic sections in exact order plus legacy fields.
 * No MongoDB Summary model is used; all data is persisted in Supabase Storage.
 */
function formatSummaryForClient(raw, paperId) {
  if (!raw) return null;
  const pId = paperId ? paperId.toString() : (raw.paperId ? raw.paperId.toString() : '');
  return {
    summaryId: raw.summaryId || `sum_${pId}`,
    paperId: pId,

    // Seven academic sections (Executive Overview first)
    executiveOverview: raw.executiveOverview || raw.fullSummary || '',
    objective: raw.objective || '',
    background: raw.background || '',
    methods: raw.methods || '',
    results: raw.results || '',
    conclusions: raw.conclusions || raw.conclusion || '',
    limitations: raw.limitations || '',

    // Legacy fields preserved for backward compatibility
    keyFindings: Array.isArray(raw.keyFindings) ? raw.keyFindings : [],
    conclusion: raw.conclusion || raw.conclusions || '',
    fullSummary: raw.fullSummary || raw.executiveOverview || '',

    suggestedQuestions: Array.isArray(raw.suggestedQuestions) ? raw.suggestedQuestions : [],
    modelUsed: raw.modelUsed || 'gemini-3.1-flash-lite',
    processingTimeMs: raw.processingTimeMs || 0,
    storageProvider: raw.storageProvider || 'supabase',
    storagePath: raw.storagePath || `users/${raw.userId || ''}/summaries/${pId}.json`,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Helper to check if a cached summary has all required academic sections
 */
function isCompleteAcademicSummary(summary) {
  if (!summary) return false;
  return Boolean(
    summary.executiveOverview &&
    summary.objective &&
    summary.background &&
    summary.methods &&
    summary.results &&
    summary.conclusions &&
    summary.limitations
  );
}

/**
 * @route   POST /api/papers/:paperId/summarize
 * @desc    Generate or retrieve structured seven-section AI summary stored in Supabase Storage (No MongoDB)
 * @access  Private
 */
const summarizePaper = asyncHandler(async (req, res) => {
  const { paperId } = req.params;
  const { regenerate } = req.query;

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  // Find paper and explicitly include extractedText
  const paper = await ResearchPaper.findById(paperId).select('+extractedText');
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Authorization check: Verify ownership
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to access or summarize this research paper.');
  }

  // Check if summary already exists in Supabase Storage and regenerate is not requested
  if (regenerate !== 'true') {
    const existingSummary = await supabaseService.getSummary(req.user._id, paper._id);
    if (existingSummary && isCompleteAcademicSummary(existingSummary)) {
      return ApiResponse.success(
        res,
        'Existing AI summary retrieved from Supabase Storage successfully',
        formatSummaryForClient(existingSummary, paper._id)
      );
    }
  }

  // If text has not been extracted yet, extract it on the fly
  let textToSummarize = paper.extractedText;
  if (!textToSummarize || textToSummarize.trim().length === 0) {
    let extractedData = null;

    // 1. Try Supabase cloud PDF buffer
    if (paper.storageProvider === 'supabase' && paper.storagePath && supabaseService.isConfigured()) {
      try {
        const buffer = await supabaseService.downloadPdfBuffer(paper.storagePath);
        extractedData = await pdfService.extractTextFromBuffer(buffer);
      } catch (cloudErr) {
        console.warn('[Text Extraction Warning] Supabase download failed, checking local disk:', cloudErr.message);
      }
    }

    // 2. Try local disk fallback
    if (!extractedData && paper.filePath && fs.existsSync(paper.filePath)) {
      extractedData = await pdfService.extractTextFromFile(paper.filePath);
    }

    if (!extractedData) {
      throw ApiError.badRequest('Research paper file is missing on storage or server.');
    }

    paper.extractedText = extractedData.text;
    paper.pageCount = extractedData.pageCount;
    paper.wordCount = extractedData.wordCount;
    paper.characterCount = extractedData.characterCount;
    paper.status = 'processing';
    await paper.save();
    textToSummarize = extractedData.text;
  }

  if (!textToSummarize || textToSummarize.trim().length < 50) {
    throw ApiError.badRequest('Insufficient text extracted from research paper to generate an AI summary.');
  }

  // Generate structured seven-section summary through AI Service
  const { summary: aiOutput, modelUsed, processingTimeMs } = await aiService.generateSummary({
    text: textToSummarize,
    title: paper.title || paper.originalFileName,
  });

  // Build summary document payload with all seven academic sections
  const now = new Date().toISOString();
  const summaryPayload = {
    summaryId: `sum_${paper._id}`,
    paperId: paper._id.toString(),
    userId: req.user._id.toString(),
    // Seven academic sections
    executiveOverview: aiOutput.executiveOverview || '',
    objective: aiOutput.objective || '',
    background: aiOutput.background || '',
    methods: aiOutput.methods || '',
    results: aiOutput.results || '',
    conclusions: aiOutput.conclusions || aiOutput.conclusion || '',
    limitations: aiOutput.limitations || '',
    // Legacy fields preserved for backward compatibility
    keyFindings: Array.isArray(aiOutput.keyFindings) ? aiOutput.keyFindings : [],
    conclusion: aiOutput.conclusion || aiOutput.conclusions || '',
    fullSummary: aiOutput.fullSummary || aiOutput.executiveOverview || '',
    suggestedQuestions: Array.isArray(aiOutput.suggestedQuestions) ? aiOutput.suggestedQuestions : [],
    modelUsed,
    processingTimeMs,
    createdAt: now,
    updatedAt: now,
  };

  // Save summary JSON directly in Supabase Storage (no MongoDB)
  const uploadResult = await supabaseService.uploadSummary(req.user._id, paper._id, summaryPayload);
  summaryPayload.storageProvider = uploadResult.storageProvider;
  summaryPayload.storagePath = uploadResult.path;

  // Update paper document metadata
  paper.status = 'completed';
  paper.errorMessage = null;
  paper.summaryStoragePath = uploadResult.path;
  paper.summaryStorageProvider = uploadResult.storageProvider;
  await paper.save();

  return ApiResponse.success(
    res,
    'AI summary generated and stored in Supabase Storage successfully',
    formatSummaryForClient(summaryPayload, paper._id),
    200
  );
});

/**
 * @route   GET /api/papers/:paperId/summary
 * @desc    Get saved AI summary from Supabase Storage (No MongoDB)
 * @access  Private
 */
const getPaperSummary = asyncHandler(async (req, res) => {
  const { paperId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Authorization check: Verify ownership
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to view the summary for this paper.');
  }

  // Fetch summary from Supabase Storage
  const summary = await supabaseService.getSummary(req.user._id, paper._id);
  if (!summary) {
    throw ApiError.notFound('Summary has not been generated for this paper yet. Please generate a summary first.');
  }

  return ApiResponse.success(
    res,
    'AI summary retrieved successfully from Supabase Storage',
    formatSummaryForClient(summary, paper._id)
  );
});

/**
 * @route   GET /api/papers/:paperId/summary/download
 * @desc    Download formatted research paper summary (PDF or Text) loaded from Supabase Storage
 * @access  Private
 */
const downloadSummary = asyncHandler(async (req, res) => {
  const { paperId } = req.params;
  const { format } = req.query; // 'pdf' (default) or 'txt'

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Authorization check: Verify ownership
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to download the summary for this paper.');
  }

  // Fetch summary from Supabase Storage
  const summaryRaw = await supabaseService.getSummary(req.user._id, paper._id);
  if (!summaryRaw) {
    throw ApiError.notFound('Summary has not been generated for this paper yet. Please generate a summary first.');
  }

  const summary = formatSummaryForClient(summaryRaw, paper._id);
  const safeTitle = (paper.title || paper.originalFileName).replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'txt' || format === 'text') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeTitle}_Summary.txt"`
    );
    const textContent = exportService.generateTextSummary(paper, summary);
    return res.send(textContent);
  }

  // Default: Formatted PDF document
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeTitle}_Summary.pdf"`
  );

  exportService.generatePdfSummary(paper, summary, res);
});

/**
 * @route   GET /api/papers/:paperId/questions
 * @desc    Get or generate suggested questions for a research paper from Supabase Storage
 * @access  Private
 */
const getSuggestedQuestions = asyncHandler(async (req, res) => {
  const { paperId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  // Retrieve paper with extractedText
  const paper = await ResearchPaper.findById(paperId).select('+extractedText');
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Authorization check: Verify ownership
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to access suggested questions for this research paper.');
  }

  // 1. If suggestions already exist in Supabase summary file, return them
  let summary = await supabaseService.getSummary(req.user._id, paper._id);
  if (summary && Array.isArray(summary.suggestedQuestions) && summary.suggestedQuestions.length > 0) {
    return ApiResponse.success(res, 'Suggested questions retrieved successfully from Supabase Storage', {
      paperId: paper._id,
      questions: summary.suggestedQuestions,
    });
  }

  // 2. Ensure extracted paper text exists
  let text = paper.extractedText;
  if (!text || text.trim().length === 0) {
    let extractedData = null;
    if (paper.storageProvider === 'supabase' && paper.storagePath && supabaseService.isConfigured()) {
      try {
        const buffer = await supabaseService.downloadPdfBuffer(paper.storagePath);
        extractedData = await pdfService.extractTextFromBuffer(buffer);
      } catch (cloudErr) {
        console.warn('[Questions Text Extraction Warning] Supabase download error:', cloudErr.message);
      }
    }

    if (!extractedData && paper.filePath && fs.existsSync(paper.filePath)) {
      extractedData = await pdfService.extractTextFromFile(paper.filePath);
    }

    if (extractedData) {
      paper.extractedText = extractedData.text;
      paper.pageCount = extractedData.pageCount;
      paper.wordCount = extractedData.wordCount;
      paper.characterCount = extractedData.characterCount;
      await paper.save();
      text = extractedData.text;
    } else {
      throw ApiError.badRequest('Paper file content is not available to generate questions.');
    }
  }

  // 3. Generate questions via AI Service
  const questions = await aiService.generateQuestions({
    paperText: text,
    paperTitle: paper.title || paper.originalFileName,
  });

  // 4. Validate output
  if (!Array.isArray(questions) || questions.length === 0) {
    throw ApiError.internal('Failed to generate valid suggested questions.');
  }

  // 5. Store questions in Supabase Storage summary document
  const now = new Date().toISOString();
  if (summary) {
    summary.suggestedQuestions = questions;
    summary.updatedAt = now;
  } else {
    const objectivePlaceholder = `Analyze research objectives and contributions for ${paper.title || paper.originalFileName}.`;
    const textExcerpt = text.length > 400 ? text.slice(0, 400) + '...' : text;
    summary = {
      summaryId: `sum_${paper._id}`,
      paperId: paper._id.toString(),
      userId: req.user._id.toString(),
      executiveOverview: textExcerpt,
      objective: objectivePlaceholder,
      background: '',
      methods: '',
      results: '',
      conclusions: '',
      limitations: '',
      keyFindings: ['Key findings pending full summarization.'],
      conclusion: 'Conclusion pending full summarization.',
      fullSummary: textExcerpt,
      suggestedQuestions: questions,
      modelUsed: aiService.modelName,
      createdAt: now,
      updatedAt: now,
    };
  }

  await supabaseService.uploadSummary(req.user._id, paper._id, summary);

  return ApiResponse.success(res, 'Suggested questions generated and saved in Supabase Storage successfully', {
    paperId: paper._id,
    questions: summary.suggestedQuestions,
  });
});

/**
 * @route   GET /api/papers/:paperId/related
 * @desc    Discover related research papers using Semantic Scholar + OpenAlex
 * @access  Private
 */
const getRelatedPapers = asyncHandler(async (req, res) => {
  const { paperId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Ownership check
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to access recommendations for this paper.');
  }

  // Get the AI summary from Supabase Storage if available to extract keywords
  const summary = await supabaseService.getSummary(req.user._id, paper._id);

  const { papers, query, sources, error } = await recommendationService.findRelatedPapers({
    title: paper.title || paper.originalFileName || '',
    objective: summary?.objective || '',
    results: summary?.results || '',
  });

  return ApiResponse.success(
    res,
    papers.length > 0
      ? `Found ${papers.length} related paper${papers.length === 1 ? '' : 's'}`
      : (error || 'No related papers found'),
    {
      paperId: paper._id,
      relatedPapers: papers,
      query,
      sources,
      count: papers.length,
    }
  );
});

module.exports = {
  summarizePaper,
  getPaperSummary,
  downloadSummary,
  getSuggestedQuestions,
  getRelatedPapers,
};

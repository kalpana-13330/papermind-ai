const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ResearchPaper = require('../models/ResearchPaper');
const ChatSession = require('../models/ChatSession');
const pdfService = require('../services/pdfService');
const urlService = require('../services/urlService');
const supabaseService = require('../services/supabaseService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');


/**
 * @route   POST /api/papers/upload
 * @desc    Upload research paper PDF (Max 20MB)
 * @access  Private
 */
const uploadPaper = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded. Please select a PDF file using the "file" field.');
  }

  try {
    const rawTitle = path.basename(
      req.file.originalname,
      path.extname(req.file.originalname)
    );

    let storageProvider = 'local';
    let storagePath = null;

    // If Supabase Storage is configured, store PDF in private cloud bucket
    if (supabaseService.isConfigured()) {
      try {
        const uniqueSuffix = `${Date.now()}-${path.basename(req.file.filename)}`;
        storagePath = `users/${req.user._id}/papers/${uniqueSuffix}`;
        await supabaseService.uploadPdfFromFile(req.file.path, storagePath, req.file.mimetype);
        storageProvider = 'supabase';
        console.log(`[Upload] PDF securely uploaded to Supabase Storage at "${storagePath}".`);
      } catch (cloudErr) {
        console.warn('[Upload Warning] Supabase upload failed, falling back to local disk storage:', cloudErr.message);
        storageProvider = 'local';
        storagePath = null;
      }
    }

    const paper = await ResearchPaper.create({
      userId: req.user._id,
      title: rawTitle,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,
      storageProvider,
      storagePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'uploaded',
    });

    return ApiResponse.success(
      res,
      'Research paper uploaded successfully',
      {
        paperId: paper._id,
        fileName: paper.originalFileName,
        fileSize: paper.fileSize,
        storageProvider: paper.storageProvider,
        status: paper.status,
      },
      201
    );
  } catch (error) {
    // If database insertion fails, clean up the orphaned file on disk
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('[Upload Error] Failed to delete orphaned file:', unlinkErr.message);
      }
    }
    throw error;
  }
});

/**
 * @route   GET /api/papers
 * @desc    Get authenticated user's uploaded research papers (Dashboard with pagination)
 * @access  Private
 */
const getPapers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const total = await ResearchPaper.countDocuments({ userId: req.user._id });

  // Exclude full extractedText for dashboard efficiency; sort newest first
  const papers = await ResearchPaper.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const formattedPapers = papers.map((paper) => ({
    id: paper._id,
    paperId: paper._id,
    title: paper.title || paper.originalFileName,
    fileName: paper.originalFileName,
    fileSize: paper.fileSize,
    mimeType: paper.mimeType,
    status: paper.status,
    pageCount: paper.pageCount || 0,
    wordCount: paper.wordCount || 0,
    uploadedAt: paper.createdAt,
    processedAt: paper.extractedAt || null,
    createdAt: paper.createdAt,
    updatedAt: paper.updatedAt,
  }));

  return res.status(200).json({
    success: true,
    data: {
      papers: formattedPapers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

/**
 * @route   GET /api/papers/:paperId
 * @desc    Get metadata of a specific paper owned by authenticated user
 * @access  Private
 */
const getPaperById = asyncHandler(async (req, res) => {
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
    throw ApiError.forbidden('You do not have permission to access this research paper.');
  }

  return ApiResponse.success(res, 'Research paper details retrieved successfully', {
    paper: paper.toClientJSON(),
  });
});

/**
 * @route   GET /api/papers/:paperId/pdf
 * @desc    Stream or view raw PDF of a paper owned by authenticated user
 * @access  Private
 */
const getPdfFile = asyncHandler(async (req, res) => {
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
    throw ApiError.forbidden('You do not have permission to access this PDF.');
  }

  // 1. If stored in Supabase Storage, retrieve buffer from cloud
  if (paper.storageProvider === 'supabase' && paper.storagePath && supabaseService.isConfigured()) {
    try {
      const buffer = await supabaseService.downloadPdfBuffer(paper.storagePath);
      res.setHeader('Content-Type', paper.mimeType || 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(paper.originalFileName)}"`
      );
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (cloudErr) {
      console.warn('[PDF Stream Warning] Supabase download failed, attempting local fallback:', cloudErr.message);
    }
  }

  // 2. Check local disk fallback
  if (paper.filePath && fs.existsSync(paper.filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(paper.originalFileName)}"`
    );
    res.setHeader('Content-Length', paper.fileSize);
    const fileStream = fs.createReadStream(paper.filePath);
    return fileStream.pipe(res);
  }

  throw ApiError.notFound('Underlying PDF file was not found on server or storage.');
});

/**
 * @route   POST /api/papers/:paperId/process
 * @desc    Extract text from uploaded PDF and prepare for AI summarization
 * @access  Private
 */
const processPaper = asyncHandler(async (req, res) => {
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
    throw ApiError.forbidden('You do not have permission to process this research paper.');
  }

  // Set status to processing
  paper.status = 'processing';
  paper.errorMessage = null;
  await paper.save();

  try {
    let extractedData;

    // 1. Extract from local file if it exists on disk
    if (paper.filePath && fs.existsSync(paper.filePath)) {
      extractedData = await pdfService.extractTextFromFile(paper.filePath);
    } else if (paper.storageProvider === 'supabase' && paper.storagePath && supabaseService.isConfigured()) {
      // 2. Download from Supabase cloud storage and extract from buffer
      const buffer = await supabaseService.downloadPdfBuffer(paper.storagePath);
      extractedData = await pdfService.extractTextFromBuffer(buffer);
    } else {
      paper.status = 'failed';
      paper.errorMessage = 'PDF file not found on disk or cloud storage.';
      await paper.save();
      throw ApiError.notFound('Underlying PDF file was not found on server or cloud storage.');
    }

    // Save extracted text and update status to completed
    paper.extractedText = extractedData.text;
    paper.pageCount = extractedData.pageCount;
    paper.wordCount = extractedData.wordCount;
    paper.characterCount = extractedData.characterCount;
    paper.status = 'completed';
    paper.errorMessage = null;
    paper.extractedAt = new Date();
    await paper.save();

    return ApiResponse.success(res, 'Research paper text extracted successfully', {
      paperId: paper._id,
      fileName: paper.originalFileName,
      status: paper.status,
      pageCount: paper.pageCount,
      wordCount: paper.wordCount,
      characterCount: paper.characterCount,
    });
  } catch (error) {
    paper.status = 'failed';
    paper.errorMessage = error.message;
    await paper.save();
    throw error;
  }
});

/**
 * @route   DELETE /api/papers/:paperId
 * @desc    Delete research paper and cascade cleanup file, summary, and chat sessions
 * @access  Private
 */
const deletePaper = asyncHandler(async (req, res) => {
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
    throw ApiError.forbidden('You do not have permission to delete this research paper.');
  }

  // 1. Remove from Supabase cloud storage if stored there
  if (paper.storageProvider === 'supabase' && paper.storagePath && supabaseService.isConfigured()) {
    try {
      await supabaseService.deletePdf(paper.storagePath);
      console.log(`[Delete] File removed from Supabase Storage: ${paper.storagePath}`);
    } catch (cloudErr) {
      console.warn(`[Delete Warning] Failed to delete from Supabase: ${cloudErr.message}`);
    }
  }

  // 2. Remove physical file from disk safely if present
  if (paper.filePath && fs.existsSync(paper.filePath)) {
    try {
      fs.unlinkSync(paper.filePath);
      console.log(`[Delete] File successfully removed from local disk: ${paper.filePath}`);
    } catch (fileErr) {
      console.warn(`[Delete Warning] Failed to delete file on disk: ${fileErr.message}`);
    }
  }

  // 3. Cascade delete summary from Supabase Storage
  try {
    await supabaseService.deleteSummary(req.user._id, paper._id);
  } catch (summaryErr) {
    console.warn(`[Delete Warning] Failed to delete summary from Supabase Storage: ${summaryErr.message}`);
  }

  // 4. Cascade delete ChatSession records
  await ChatSession.deleteMany({ paperId: paper._id });

  // 5. Delete the ResearchPaper document
  await ResearchPaper.findByIdAndDelete(paper._id);

  return ApiResponse.success(res, 'Research paper and all associated records deleted successfully', {
    paperId: paper._id,
  });
});

/**
 * @route   POST /api/papers/url
 * @desc    Import a research paper from a URL (PDF link or HTML article)
 * @access  Private
 */
const urlImportPaper = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw ApiError.badRequest('A valid URL is required.');
  }

  // Pre-validate URL format before fetching
  const { error: formatError } = urlService.validateUrlFormat(url.trim());
  if (formatError) {
    throw ApiError.badRequest(formatError);
  }

  // PDF extraction helper wrapping pdfService (buffer-based)
  const pdfExtractFn = async (buffer) => {
    return pdfService.extractTextFromBuffer(buffer);
  };

  // Fetch and extract content from the URL
  const extracted = await urlService.fetchAndExtract(url.trim(), pdfExtractFn);

  if (extracted.error) {
    throw ApiError.badRequest(extracted.error);
  }

  if (!extracted.text || extracted.text.trim().length < 100) {
    throw ApiError.unprocessable(
      'Insufficient text could be extracted from the provided URL. The page may be paywalled, require JavaScript, or contain no readable research content.'
    );
  }

  // Determine a safe filename from the URL
  let rawFileName = path.basename(new URL(url.trim()).pathname) || 'imported-paper';
  if (!rawFileName.endsWith('.pdf') && !rawFileName.endsWith('.html')) {
    rawFileName = rawFileName + (extracted.contentType && extracted.contentType.includes('pdf') ? '.pdf' : '.html');
  }
  const safeTitle = extracted.title || rawFileName.replace(/\.[^.]+$/, '') || 'Imported Research Paper';

  // Create ResearchPaper record in MongoDB
  const paper = await ResearchPaper.create({
    userId: req.user._id,
    title: safeTitle,
    originalFileName: rawFileName,
    storedFileName: null,
    filePath: null,
    fileSize: extracted.text.length,     // approximate size in bytes
    mimeType: extracted.contentType || 'text/html',
    status: 'completed',
    sourceType: 'url',
    sourceUrl: extracted.sourceUrl || url.trim(),
    extractedText: extracted.text,
    pageCount: extracted.pageCount || 1,
    wordCount: extracted.wordCount || 0,
    characterCount: extracted.characterCount || 0,
    extractedAt: new Date(),
  });

  return ApiResponse.success(
    res,
    'Research paper imported from URL successfully',
    {
      paperId: paper._id,
      title: paper.title,
      fileName: paper.originalFileName,
      sourceType: 'url',
      sourceUrl: paper.sourceUrl,
      wordCount: paper.wordCount,
      pageCount: paper.pageCount,
      status: paper.status,
    },
    201
  );
});

module.exports = {
  uploadPaper,
  getPapers,
  getPaperById,
  getPdfFile,
  processPaper,
  deletePaper,
  urlImportPaper,
};

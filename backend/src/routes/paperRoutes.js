const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');
const summaryController = require('../controllers/summaryController');
const chatController = require('../controllers/chatController');
const authenticate = require('../middlewares/authMiddleware');
const { uploadSinglePdf } = require('../middlewares/uploadMiddleware');

/**
 * @route   POST /api/papers/upload
 * @desc    Upload research paper PDF (Max 20MB)
 * @access  Private
 */
router.post('/upload', authenticate, uploadSinglePdf, paperController.uploadPaper);

/**
 * @route   POST /api/papers/url
 * @desc    Import a research paper from a URL (PDF link or HTML article page)
 * @access  Private
 */
router.post('/url', authenticate, paperController.urlImportPaper);

/**
 * @route   GET /api/papers
 * @desc    Get all research papers for authenticated user (Dashboard with pagination)
 * @access  Private
 */
router.get('/', authenticate, paperController.getPapers);

/**
 * @route   GET /api/papers/:paperId
 * @desc    Get paper metadata by ID
 * @access  Private
 */
router.get('/:paperId', authenticate, paperController.getPaperById);

/**
 * @route   DELETE /api/papers/:paperId
 * @desc    Delete research paper and cascade clean associated file, summary, and chat sessions
 * @access  Private
 */
router.delete('/:paperId', authenticate, paperController.deletePaper);

/**
 * @route   GET /api/papers/:paperId/pdf
 * @desc    Stream/download raw PDF file
 * @access  Private
 */
router.get('/:paperId/pdf', authenticate, paperController.getPdfFile);

/**
 * @route   POST /api/papers/:paperId/process
 * @desc    Extract text from uploaded PDF and update status
 * @access  Private
 */
router.post('/:paperId/process', authenticate, paperController.processPaper);

/**
 * @route   POST /api/papers/:paperId/summarize
 * @desc    Generate structured AI summary for extracted research paper text
 * @access  Private
 */
router.post('/:paperId/summarize', authenticate, summaryController.summarizePaper);

/**
 * @route   GET /api/papers/:paperId/summary
 * @desc    Retrieve saved AI summary for a research paper
 * @access  Private
 */
router.get('/:paperId/summary', authenticate, summaryController.getPaperSummary);

/**
 * @route   GET /api/papers/:paperId/summary/download
 * @desc    Download formatted research paper summary (PDF or Text)
 * @access  Private
 */
router.get('/:paperId/summary/download', authenticate, summaryController.downloadSummary);

/**
 * @route   GET /api/papers/:paperId/questions
 * @desc    Get or generate tailored suggested questions for a research paper
 * @access  Private
 */
router.get('/:paperId/questions', authenticate, summaryController.getSuggestedQuestions);

/**
 * @route   GET /api/papers/:paperId/related
 * @desc    Discover related papers (Semantic Scholar + OpenAlex)
 * @access  Private
 */
router.get('/:paperId/related', authenticate, summaryController.getRelatedPapers);

/**
 * @route   POST /api/papers/:paperId/chat
 * @desc    Ask a question grounded in the research paper
 * @access  Private
 */
router.post('/:paperId/chat', authenticate, chatController.askQuestion);

/**
 * @route   GET /api/papers/:paperId/chat
 * @desc    Get chat message history for the research paper
 * @access  Private
 */
router.get('/:paperId/chat', authenticate, chatController.getChatHistory);

/**
 * @route   DELETE /api/papers/:paperId/chat
 * @desc    Clear chat session history for the research paper
 * @access  Private
 */
router.delete('/:paperId/chat', authenticate, chatController.clearChatHistory);

module.exports = router;

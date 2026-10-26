const mongoose = require('mongoose');
const ResearchPaper = require('../models/ResearchPaper');
const ChatSession = require('../models/ChatSession');
const aiService = require('../services/aiService');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   POST /api/papers/:paperId/chat
 * @desc    Ask a question about a research paper (Chat with paper)
 * @access  Private
 */
const askQuestion = asyncHandler(async (req, res) => {
  const { paperId } = req.params;
  const { message } = req.body;

  // Validate user message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw ApiError.badRequest('Question cannot be empty.');
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > 2000) {
    throw ApiError.badRequest('Question exceeds maximum allowed length of 2000 characters.');
  }

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  // Retrieve paper with extractedText
  const paper = await ResearchPaper.findById(paperId).select('+extractedText');
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Verify ownership
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to ask questions about this research paper.');
  }

  // Verify paper processing is completed
  if (paper.status !== 'completed' || !paper.extractedText || paper.extractedText.trim().length === 0) {
    throw ApiError.badRequest(
      'Research paper processing has not been completed yet. Please process the paper first before using Chat.'
    );
  }

  // Find or create chat session for this user and paper
  let session = await ChatSession.findOne({
    userId: req.user._id,
    paperId: paper._id,
  });

  if (!session) {
    session = new ChatSession({
      userId: req.user._id,
      paperId: paper._id,
      messages: [],
    });
  }

  // Generate grounded answer via AI Service
  const answer = await aiService.answerQuestion({
    paperText: paper.extractedText,
    paperTitle: paper.title || paper.originalFileName,
    question: trimmedMessage,
    conversationHistory: session.messages,
  });

  const timestamp = new Date();

  // Store user message and assistant answer
  session.messages.push({
    role: 'user',
    content: trimmedMessage,
    timestamp,
  });

  session.messages.push({
    role: 'assistant',
    content: answer,
    timestamp: new Date(),
  });

  await session.save();

  return res.status(200).json({
    success: true,
    data: {
      answer,
      paperId: paper._id,
      timestamp,
    },
  });
});

/**
 * @route   GET /api/papers/:paperId/chat
 * @desc    Retrieve chat history for a research paper
 * @access  Private
 */
const getChatHistory = asyncHandler(async (req, res) => {
  const { paperId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Verify ownership
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to view chat history for this research paper.');
  }

  const session = await ChatSession.findOne({
    userId: req.user._id,
    paperId: paper._id,
  });

  if (!session) {
    return ApiResponse.success(res, 'Chat history retrieved', {
      paperId: paper._id,
      messages: [],
      totalMessages: 0,
    });
  }

  return ApiResponse.success(res, 'Chat history retrieved successfully', session.toClientJSON());
});

/**
 * @route   DELETE /api/papers/:paperId/chat
 * @desc    Clear chat session history for a research paper
 * @access  Private
 */
const clearChatHistory = asyncHandler(async (req, res) => {
  const { paperId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    throw ApiError.badRequest('Invalid paper ID format.');
  }

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) {
    throw ApiError.notFound('Research paper not found.');
  }

  // Verify ownership
  if (paper.userId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to clear chat history for this research paper.');
  }

  await ChatSession.findOneAndDelete({
    userId: req.user._id,
    paperId: paper._id,
  });

  return ApiResponse.success(res, 'Chat session cleared successfully', {
    paperId: paper._id,
  });
});

module.exports = {
  askQuestion,
  getChatHistory,
  clearChatHistory,
};

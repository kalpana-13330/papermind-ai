const mongoose = require('mongoose');

/**
 * ResearchPaper Model
 *
 * Supports two source types:
 *   - 'pdf'  — file uploaded from user's device (default)
 *   - 'url'  — imported from a web URL (PDF link or HTML article)
 *
 * New fields added:
 *   - sourceType   : 'pdf' | 'url'
 *   - sourceUrl    : original URL for URL-imported papers
 */
const researchPaperSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    // Optional — null for URL-imported papers
    storedFileName: {
      type: String,
      sparse: true,   // allow multiple null values with unique index
    },
    // Optional — null for URL-imported papers
    filePath: {
      type: String,
      default: null,
    },
    // Supabase Storage & cloud metadata
    storageProvider: {
      type: String,
      enum: ['local', 'supabase'],
      default: 'local',
      index: true,
    },
    storagePath: {
      type: String,
      default: null,
    },
    // Supabase Storage for paper summaries (JSON)
    summaryStoragePath: {
      type: String,
      default: null,
    },
    summaryStorageProvider: {
      type: String,
      enum: ['supabase', 'local', null],
      default: null,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      // Limit to 20 MB for uploaded files; URL imports approximate with text length
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },

    // ── Source type (PDF upload vs URL import) ─────────────────────────────
    sourceType: {
      type: String,
      enum: ['pdf', 'url'],
      default: 'pdf',
      index: true,
    },
    // Original source URL — populated for URL-imported papers
    sourceUrl: {
      type: String,
      default: null,
      trim: true,
    },

    // ── Processing Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },

    // ── Extracted Content Metrics ──────────────────────────────────────────
    pageCount: {
      type: Number,
      default: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    extractedText: {
      type: String,
      select: false, // Large text excluded from default queries for efficiency
    },
    extractedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Format clean JSON response for client.
 * Excludes sensitive server paths, raw extracted text, and internal fields.
 */
researchPaperSchema.methods.toClientJSON = function () {
  return {
    paperId: this._id,
    title: this.title || this.originalFileName,
    fileName: this.originalFileName,
    fileSize: this.fileSize,
    mimeType: this.mimeType,
    sourceType: this.sourceType || 'pdf',
    storageProvider: this.storageProvider || 'local',
    sourceUrl: this.sourceUrl || null,
    status: this.status,
    pageCount: this.pageCount,
    wordCount: this.wordCount,
    characterCount: this.characterCount,
    errorMessage: this.errorMessage || null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const ResearchPaper = mongoose.model('ResearchPaper', researchPaperSchema);

module.exports = ResearchPaper;

const mongoose = require('mongoose');

/**
 * Summary Model — Seven-Section Academic Structure
 *
 * Sections:
 *   1. executiveOverview - Comprehensive, standalone introductory synthesis
 *   2. objective         - Research questions, purpose, problem addressed
 *   3. background        - Prior research, context, theoretical motivation
 *   4. methods           - Methodology, design, models, analytical approach
 *   5. results           - Important findings, evidence, quantitative metrics
 *   6. conclusions       - Implications, contributions, policy/practical impacts
 *   7. limitations       - Author-acknowledged constraints & future directions
 *
 * Legacy fields preserved for backward compatibility:
 *   keyFindings     — Array form of results (derived from results field)
 *   conclusion      — Alias kept for old frontend/API callers
 *   fullSummary     — Concatenated overview (auto-generated if missing)
 */
const summarySchema = new mongoose.Schema(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchPaper',
      required: [true, 'Research paper ID is required'],
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // ─── Seven Academic Sections ─────────────────────────────────────────────
    executiveOverview: {
      type: String,
      trim: true,
      default: '',
    },
    objective: {
      type: String,
      required: [true, 'Objective is required'],
      trim: true,
    },
    background: {
      type: String,
      trim: true,
      default: '',
    },
    methods: {
      type: String,
      trim: true,
      default: '',
    },
    results: {
      type: String,
      trim: true,
      default: '',
    },
    conclusions: {
      type: String,
      trim: true,
      default: '',
    },
    limitations: {
      type: String,
      trim: true,
      default: '',
    },

    // ─── Legacy / Compatibility Fields ────────────────────────────────────────
    keyFindings: {
      type: [String],
      required: [true, 'Key findings are required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one key finding is required',
      },
    },
    conclusion: {
      type: String,
      required: [true, 'Conclusion is required'],
      trim: true,
    },
    fullSummary: {
      type: String,
      required: [true, 'Full summary is required'],
      trim: true,
    },

    // ─── Questions & Metadata ─────────────────────────────────────────────────
    suggestedQuestions: {
      type: [String],
      required: [true, 'Suggested questions are required'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one suggested question is required',
      },
    },
    modelUsed: {
      type: String,
      default: 'gemini-3.1-flash-lite',
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Format clean JSON response for client.
 * Returns all seven sections in exact order plus legacy fields for backward compatibility.
 * Handles legacy documents that may be missing new section fields safely.
 */
summarySchema.methods.toClientJSON = function () {
  return {
    summaryId: this._id,
    paperId: this.paperId,

    // Seven academic sections (Executive Overview first)
    executiveOverview: this.executiveOverview || this.fullSummary || '',
    objective: this.objective || '',
    background: this.background || '',
    methods: this.methods || '',
    results: this.results || '',
    conclusions: this.conclusions || this.conclusion || '',
    limitations: this.limitations || '',

    // Legacy fields (preserved for existing frontend code)
    keyFindings: this.keyFindings || [],
    conclusion: this.conclusion || this.conclusions || '',
    fullSummary: this.fullSummary || this.executiveOverview || '',

    suggestedQuestions: this.suggestedQuestions || [],
    modelUsed: this.modelUsed || 'unknown',
    processingTimeMs: this.processingTimeMs || 0,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Summary = mongoose.model('Summary', summarySchema);

module.exports = Summary;

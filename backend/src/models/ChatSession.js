const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchPaper',
      required: [true, 'Paper ID is required'],
      index: true,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find user's chat session for a paper
chatSessionSchema.index({ userId: 1, paperId: 1 }, { unique: true });

chatSessionSchema.methods.toClientJSON = function () {
  return {
    sessionId: this._id,
    paperId: this.paperId,
    messages: this.messages.map((m) => ({
      messageId: m._id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
    totalMessages: this.messages.length,
    updatedAt: this.updatedAt,
  };
};

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;

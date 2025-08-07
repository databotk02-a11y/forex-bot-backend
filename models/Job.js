// ===== models/Job.js =====
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [1000, 'Content cannot exceed 1000 characters']
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  executedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  error: {
    message: String,
    stack: String,
    code: String
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  result: {
    success: Boolean,
    responseTime: Number, // milliseconds
    screenshot: String, // base64 if needed
    postUrl: String // URL of the created post
  }
}, {
  timestamps: true
});

// Index for efficient queries
jobSchema.index({ scheduledAt: 1, status: 1 });
jobSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
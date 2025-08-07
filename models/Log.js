// ===== models/Log.js =====
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warn', 'error', 'debug'],
    default: 'info'
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['auth', 'bot', 'job', 'system'],
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for log queries
logSchema.index({ createdAt: -1, level: 1 });
logSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
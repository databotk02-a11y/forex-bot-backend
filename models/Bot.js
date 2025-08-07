// ===== models/Bot.js =====
const mongoose = require('mongoose');
const crypto = require('crypto');

const botSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bot name is required'],
    trim: true,
    maxlength: [50, 'Bot name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Bot username is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Bot password is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'inactive'
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  settings: {
    delayBetweenPosts: {
      type: Number,
      default: 30 // seconds
    },
    retryAttempts: {
      type: Number,
      default: 3
    },
    userAgent: {
      type: String,
      default: 'chrome'
    }
  }
}, {
  timestamps: true
});

// Encrypt password before saving
botSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();
  
  const cipher = crypto.createCipher('aes-256-cbc', process.env.JWT_SECRET);
  let encrypted = cipher.update(this.password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  this.password = encrypted;
  next();
});

// Decrypt password method
botSchema.methods.getDecryptedPassword = function() {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.JWT_SECRET);
  let decrypted = decipher.update(this.password, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Calculate success rate
botSchema.virtual('successRate').get(function() {
  const total = this.successCount + this.failureCount;
  if (total === 0) return 0;
  return Math.round((this.successCount / total) * 100);
});

module.exports = mongoose.model('Bot', botSchema);

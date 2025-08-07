// ===== controllers/logController.js =====
const Log = require('../models/Log');

const getLogs = async (req, res) => {
  try {
    const { level, category, page = 1, limit = 50 } = req.query;
    
    // Build query
    const query = {};
    if (level) query.level = level;
    if (category) query.category = category;
    
    // Add user filter for non-system logs
    if (category !== 'system') {
      query.user = req.user._id;
    }

    const logs = await Log.find(query)
      .populate('job', 'url content')
      .populate('bot', 'name')
      .populate('user', 'username')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const clearLogs = async (req, res) => {
  try {
    const { level, category, olderThan } = req.body;

    let query = { user: req.user._id };
    
    if (level) query.level = level;
    if (category) query.category = category;
    if (olderThan) {
      query.createdAt = { $lt: new Date(olderThan) };
    }

    const result = await Log.deleteMany(query);

    res.json({
      success: true,
      message: `${result.deletedCount} logs cleared successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { getLogs, clearLogs };
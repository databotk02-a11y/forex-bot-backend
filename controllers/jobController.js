// ===== controllers/jobController.js =====
const Job = require('../models/Job');
const Bot = require('../models/Bot');
const Log = require('../models/Log');

const getJobs = async (req, res) => {
  try {
    const { status, botId, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { owner: req.user._id };
    if (status) query.status = status;
    if (botId) query.bot = botId;

    const jobs = await Job.find(query)
      .populate('bot', 'name username')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
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

const createJob = async (req, res) => {
  try {
    const { botId, url, content, scheduledAt } = req.body;

    // Validate bot ownership
    const bot = await Bot.findOne({ 
      _id: botId, 
      owner: req.user._id 
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    // Validate scheduled time is in future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    const job = await Job.create({
      bot: botId,
      url,
      content,
      scheduledAt: scheduledDate,
      owner: req.user._id
    });

    await job.populate('bot', 'name username');

    // Log job creation
    await Log.create({
      level: 'info',
      message: `Job scheduled for bot "${bot.name}"`,
      category: 'job',
      job: job._id,
      bot: botId,
      user: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Job scheduled successfully',
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating completed or processing jobs
    const job = await Job.findOne({ 
      _id: id, 
      owner: req.user._id,
      status: { $in: ['pending', 'failed'] }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or cannot be updated'
      });
    }

    // If updating scheduled time, validate it
    if (updates.scheduledAt) {
      const scheduledDate = new Date(updates.scheduledAt);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be in the future'
        });
      }
      updates.scheduledAt = scheduledDate;
    }

    // Update job
    Object.assign(job, updates);
    await job.save();
    await job.populate('bot', 'name username');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOneAndDelete({ 
      _id: id, 
      owner: req.user._id,
      status: { $in: ['pending', 'failed'] }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or cannot be deleted'
      });
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const retryJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ 
      _id: id, 
      owner: req.user._id,
      status: 'failed'
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Failed job not found'
      });
    }

    if (job.retryCount >= job.maxRetries) {
      return res.status(400).json({
        success: false,
        message: 'Maximum retry attempts reached'
      });
    }

    // Reset job for retry
    job.status = 'pending';
    job.retryCount += 1;
    job.error = undefined;
    job.executedAt = null;
    job.completedAt = null;

    await job.save();

    res.json({
      success: true,
      message: 'Job queued for retry',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const cancelJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ 
      _id: id, 
      owner: req.user._id,
      status: { $in: ['pending', 'processing'] }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or cannot be cancelled'
      });
    }

    job.status = 'cancelled';
    await job.save();

    res.json({
      success: true,
      message: 'Job cancelled successfully',
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getJobStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Job.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    const totalJobs = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const successRate = totalJobs > 0 
      ? Math.round((statusCounts.completed / totalJobs) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        ...statusCounts,
        total: totalJobs,
        successRate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  retryJob,
  cancelJob,
  getJobStats
};
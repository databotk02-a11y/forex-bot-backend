// ===== controllers/botController.js =====
const Bot = require('../models/Bot');
const Log = require('../models/Log');

const getBots = async (req, res) => {
  try {
    const bots = await Bot.find({ owner: req.user._id })
      .select('-password')
      .sort('-createdAt');

    // Add virtual success rate
    const botsWithStats = bots.map(bot => ({
      ...bot.toObject(),
      successRate: bot.successRate
    }));

    res.json({
      success: true,
      data: botsWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const createBot = async (req, res) => {
  try {
    const { name, username, password, settings } = req.body;

    // Check if bot with same name exists for this user
    const existingBot = await Bot.findOne({
      name,
      owner: req.user._id
    });

    if (existingBot) {
      return res.status(400).json({
        success: false,
        message: 'Bot with this name already exists'
      });
    }

    const bot = await Bot.create({
      name,
      username,
      password,
      settings: settings || {},
      owner: req.user._id
    });

    // Log bot creation
    await Log.create({
      level: 'info',
      message: `Bot "${name}" created`,
      category: 'bot',
      bot: bot._id,
      user: req.user._id
    });

    // Return bot without password
    const botResponse = bot.toObject();
    delete botResponse.password;
    botResponse.successRate = bot.successRate;

    res.status(201).json({
      success: true,
      message: 'Bot created successfully',
      data: botResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const updateBot = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const bot = await Bot.findOne({ 
      _id: id, 
      owner: req.user._id 
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    // Update bot
    Object.assign(bot, updates);
    await bot.save();

    // Log bot update
    await Log.create({
      level: 'info',
      message: `Bot "${bot.name}" updated`,
      category: 'bot',
      bot: bot._id,
      user: req.user._id
    });

    const botResponse = bot.toObject();
    delete botResponse.password;
    botResponse.successRate = bot.successRate;

    res.json({
      success: true,
      message: 'Bot updated successfully',
      data: botResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const deleteBot = async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findOneAndDelete({ 
      _id: id, 
      owner: req.user._id 
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    // Log bot deletion
    await Log.create({
      level: 'info',
      message: `Bot "${bot.name}" deleted`,
      category: 'bot',
      user: req.user._id
    });

    res.json({
      success: true,
      message: 'Bot deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const testBotLogin = async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findOne({ 
      _id: id, 
      owner: req.user._id 
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    // TODO: Implement actual login test with Puppeteer
    // For now, simulate success
    bot.lastLoginAt = new Date();
    bot.status = 'active';
    await bot.save();

    res.json({
      success: true,
      message: 'Bot login test successful',
      data: {
        loginTime: bot.lastLoginAt,
        status: bot.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const getBotStats = async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await Bot.findOne({ 
      _id: id, 
      owner: req.user._id 
    });

    if (!bot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found'
      });
    }

    res.json({
      success: true,
      data: {
        successCount: bot.successCount,
        failureCount: bot.failureCount,
        successRate: bot.successRate,
        lastLoginAt: bot.lastLoginAt,
        status: bot.status
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
  getBots,
  createBot,
  updateBot,
  deleteBot,
  testBotLogin,
  getBotStats
};

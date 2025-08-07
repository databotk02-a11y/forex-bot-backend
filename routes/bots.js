// ===== routes/bots.js =====
const express = require('express');
const { 
  getBots, 
  createBot, 
  updateBot, 
  deleteBot, 
  testBotLogin,
  getBotStats
} = require('../controllers/botController');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth); // All routes require authentication

router.get('/', getBots);
router.post('/', createBot);
router.put('/:id', updateBot);
router.delete('/:id', deleteBot);
router.post('/:id/test', testBotLogin);
router.get('/:id/stats', getBotStats);

module.exports = router;
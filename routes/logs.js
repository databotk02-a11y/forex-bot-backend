// ===== routes/logs.js =====
const express = require('express');
const { getLogs, clearLogs } = require('../controllers/logController');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', getLogs);
router.delete('/clear', clearLogs);

module.exports = router;
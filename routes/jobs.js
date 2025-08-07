// ===== routes/jobs.js =====
const express = require('express');
const { 
  getJobs, 
  createJob, 
  updateJob, 
  deleteJob, 
  getJobStats,
  retryJob,
  cancelJob
} = require('../controllers/jobController');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

router.get('/', getJobs);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.post('/:id/retry', retryJob);
router.post('/:id/cancel', cancelJob);
router.get('/stats', getJobStats);

module.exports = router;
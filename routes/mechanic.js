import express from 'express';
import {
  getMyJobs,
  getMechanicStats,
  startJob,
  addPart,
  addLabor,
  completeJob,
} from '../controllers/mechanicController.js';
import { authRequired, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require Mechanic role
router.use(authRequired, authorize('Mechanic'));

// Get mechanic statistics
router.get('/stats', getMechanicStats);

// Get assigned jobs
router.get('/jobs', getMyJobs);

// Start a job
router.put('/jobs/:id/start', startJob);

// Add part to job
router.post('/jobs/:id/parts', addPart);

// Add labor to job
router.post('/jobs/:id/labor', addLabor);

// Complete a job
router.put('/jobs/:id/complete', completeJob);

export default router;
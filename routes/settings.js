import express from 'express';
import {
  getSettings,
  updateSettings,
} from '../controllers/settingsController.js';
import { authRequired, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require Manager role
router.use(authRequired, authorize('Manager'));

// Get settings
router.get('/', getSettings);

// Update settings
router.put('/', updateSettings);

export default router;
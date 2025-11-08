import express from 'express';
import {
  submitFeedback,
  getAllFeedback,
  getMyFeedback,
  getMechanicRatings,
} from '../controllers/feedbackController.js';
import { authRequired, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get my feedback (Customer)
router.get('/my-feedback', authRequired, authorize('Customer'), getMyFeedback);

// Get mechanic ratings (Manager)
router.get('/mechanic-ratings', authRequired, authorize('Manager'), getMechanicRatings);

// Get all feedback (Manager)
router.get('/', authRequired, authorize('Manager'), getAllFeedback);

// Submit feedback (Customer)
router.post('/', authRequired, authorize('Customer'), submitFeedback);

export default router;
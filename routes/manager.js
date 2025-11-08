import express from 'express';
import {
  getUnassignedAppointments,
  getMechanics,
  assignAppointment,
  getDashboardStats,
  createMechanic,
} from '../controllers/managerController.js';
import { authRequired, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require Manager role
router.use(authRequired, authorize('Manager'));

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get unassigned appointments
router.get('/appointments/unassigned', getUnassignedAppointments);

// Assign appointment to mechanic
router.put('/appointments/:id/assign', assignAppointment);

// Get all mechanics
router.get('/mechanics', getMechanics);

// Create new mechanic
router.post('/mechanics', createMechanic);

export default router;
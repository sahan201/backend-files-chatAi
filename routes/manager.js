import express from 'express';
import {
  assignJobToMechanic,
  getUnassignedJobs,
  getMechanics,
  createMechanic,
  deleteMechanic,
  orderInventoryItem,
  receiveInventoryStock,
} from '../controllers/managerController.js';
import { authRequired, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes in this file are for Managers only
router.use(authRequired, authorize('Manager'));

// Job Assignment
router.get('/jobs/unassigned', getUnassignedJobs);
router.put('/jobs/assign/:id', assignJobToMechanic);

// Mechanic Management
router.get('/mechanics', getMechanics);
router.post('/mechanics', createMechanic);
router.delete('/mechanics/:id', deleteMechanic);

// Inventory Management
router.post('/inventory/order/:id', orderInventoryItem);
router.put('/inventory/receive/:id', receiveInventoryStock);

export default router;
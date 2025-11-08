import express from 'express';
import {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStock,
} from '../controllers/inventoryController.js';
import { authRequired, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get low stock items (must be before /:id route)
router.get('/low-stock', authRequired, authorize('Manager'), getLowStock);

// Get all inventory items
router.get('/', authRequired, authorize('Manager', 'Mechanic'), getInventory);

// Get single inventory item
router.get('/:id', authRequired, authorize('Manager', 'Mechanic'), getInventoryItem);

// Create inventory item
router.post('/', authRequired, authorize('Manager'), createInventoryItem);

// Update inventory item
router.put('/:id', authRequired, authorize('Manager'), updateInventoryItem);

// Delete inventory item
router.delete('/:id', authRequired, authorize('Manager'), deleteInventoryItem);

export default router;
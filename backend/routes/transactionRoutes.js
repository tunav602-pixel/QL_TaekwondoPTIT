import express from 'express';
import { 
  getAllTransactions, 
  addTransaction, 
  deleteTransaction, 
  getMonthlyStats, 
  migrateFromLocalStorage,
  exportTransactions
} from '../controllers/transactionController.js';
import authMiddleware, { isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All transaction routes require authentication
router.use(authMiddleware);

// Stats endpoint (must be before /:id to avoid conflict)
router.get('/stats', getMonthlyStats);

// Migration endpoint
router.post('/migrate', migrateFromLocalStorage);

// Export endpoint (Admin only)
router.post('/export', isAdmin, exportTransactions);

// CRUD
router.get('/', getAllTransactions);
router.post('/', isAdmin, addTransaction);
router.delete('/:id', isAdmin, deleteTransaction);

export default router;

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  createExpense,
  getAllExpenses,
  getExpenseDetail,
  getMyExpenses,
  markAsPaid,
  confirmPayment,
  rejectPayment,
  deleteExpense,
  getQRCode,
  handleVietQRWebhook,
  createFreeDeposit,
  remindExpenseBulk,
  getPendingApprovals
} from '../controllers/expenseController.js';
import authMiddleware, { isAdmin } from '../middlewares/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer config for bill image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/bills');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `bill-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ===== Public webhook (no auth) =====
router.post('/webhook/vietqr', handleVietQRWebhook);

// ===== Authenticated routes =====
router.use(authMiddleware);

// User routes
router.get('/my', getMyExpenses);
router.put('/pay/:userExpenseId', upload.single('bill'), markAsPaid);
router.post('/free-deposit', createFreeDeposit);

// Admin routes
router.post('/', isAdmin, createExpense);
router.get('/', isAdmin, getAllExpenses);
router.get('/approvals', isAdmin, getPendingApprovals);
router.get('/:id', isAdmin, getExpenseDetail);
router.delete('/:id', isAdmin, deleteExpense);
router.put('/confirm/:userExpenseId', isAdmin, confirmPayment);
router.put('/reject/:userExpenseId', isAdmin, rejectPayment);
router.get('/:id/qr/:userExpenseId', getQRCode);
router.post('/remind/:expenseId', isAdmin, remindExpenseBulk);

export default router;

import express from 'express';
import {
  markAttendance,
  getAttendanceByDate,
  getMyAttendance,
  getUserAttendanceStats,
  evaluateAttendance,
  getUpcomingSessions,
  getAllMembersAttendanceStats
} from '../controllers/attendanceController.js';
import authMiddleware, { isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All attendance routes require authentication
router.use(authMiddleware);

// Public routes (any authenticated user)
router.get('/my', getMyAttendance);
router.get('/next-sessions', getUpcomingSessions);
router.get('/stats/:userId', getUserAttendanceStats);

// Admin only routes
router.post('/mark', isAdmin, markAttendance);
router.get('/', isAdmin, getAttendanceByDate);
router.get('/all-stats', isAdmin, getAllMembersAttendanceStats);
router.post('/evaluate', isAdmin, evaluateAttendance);

export default router;

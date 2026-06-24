/**
 * Task Queue Routes — Expose task status endpoints
 * Port từ MoneyPrinterTurbo controllers/v1/video.py GET /tasks, GET /tasks/:taskId
 * 
 * Cho phép frontend polling trạng thái tác vụ bất đồng bộ:
 * - Gửi thông báo hàng loạt khi tạo khoản chi
 * - Xuất báo cáo tài chính
 * - Import dữ liệu
 */
import express from 'express';
import authMiddleware, { isAdmin } from '../middlewares/authMiddleware.js';
import { taskQueue } from '../utils/taskQueueManager.js';

const router = express.Router();

// Tất cả task routes đều cần auth
router.use(authMiddleware);

/**
 * @route GET /api/tasks/stats/queue
 * @desc Lấy thống kê queue (Admin)
 * @access Admin only
 * NOTE: Đặt TRƯỚC /:taskId để tránh bị catch bởi parameterized route
 */
router.get('/stats/queue', isAdmin, (req, res) => {
  res.json({
    success: true,
    stats: taskQueue.getStats()
  });
});

/**
 * @route GET /api/tasks
 * @desc Lấy danh sách tất cả tác vụ (Admin) — giống MPT GET /tasks
 * @access Admin only
 */
router.get('/', isAdmin, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { tasks, total } = taskQueue.getAllTasks(page, pageSize);

  res.json({
    success: true,
    tasks,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  });
});

/**
 * @route GET /api/tasks/:taskId
 * @desc Lấy trạng thái 1 tác vụ — giống MPT GET /tasks/:task_id
 * @access Authenticated users
 */
router.get('/:taskId', (req, res) => {
  const task = taskQueue.getTask(req.params.taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Tác vụ không tồn tại hoặc đã hết hạn.'
    });
  }
  res.json({ success: true, task });
});

export default router;

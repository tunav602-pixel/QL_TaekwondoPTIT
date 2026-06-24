/**
 * TaskQueueManager — Port từ MoneyPrinterTurbo base_manager.py
 * 
 * Quản lý hàng đợi tác vụ nặng cho hệ thống tài chính CLB Taekwondo:
 * - Gửi email/notification hàng loạt khi tạo khoản chi
 * - Xuất báo cáo tài chính tổng hợp
 * - Import/export dữ liệu Excel
 * - Đánh giá tự động cuối tháng (evaluationCron)
 * 
 * Thay vì dùng thread (Python), Node.js dùng Promise-based concurrency.
 * Đảm bảo không chạy quá maxConcurrent tác vụ cùng lúc,
 * và giới hạn hàng đợi (backpressure) để tránh OOM.
 * 
 * Kiến trúc giống MoneyPrinterTurbo:
 *   TaskManager.add_task() → execute_task() → run_task() → task_done() → check_queue()
 */

/**
 * Custom error khi hàng đợi tác vụ đầy — giống TaskQueueFullError của MPT
 */
export class TaskQueueFullError extends Error {
  constructor(message = 'Hàng đợi tác vụ đã đầy. Vui lòng thử lại sau.') {
    super(message);
    this.name = 'TaskQueueFullError';
    this.statusCode = 429; // Too Many Requests
    this.isOperational = true;
  }
}

export class TaskQueueManager {
  /**
   * @param {number} maxConcurrent - Số tác vụ chạy đồng thời tối đa
   * @param {number} maxQueued - Số tác vụ chờ tối đa trong queue
   */
  constructor(maxConcurrent = 3, maxQueued = 50) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueued = maxQueued;
    this.running = 0;
    this.queue = [];

    // Lưu trạng thái mỗi tác vụ — giống MemoryState._tasks của MPT
    this._tasks = new Map();

    // Tự động dọn dẹp task cũ mỗi 30 phút
    this._cleanupInterval = setInterval(() => this._cleanupOldTasks(), 30 * 60 * 1000);
  }

  /**
   * Thêm tác vụ vào queue. Logic giống MPT TaskManager.add_task():
   * - Nếu còn slot → chạy ngay (execute_task)
   * - Nếu hết slot → xếp hàng (enqueue)
   * - Nếu hàng đợi đầy → reject (backpressure)
   * 
   * @param {string} taskId - ID định danh tác vụ
   * @param {Function} fn - Async function cần thực thi. Nhận callback (progress) => void
   * @param {Object} metadata - Dữ liệu bổ sung (type, createdBy, ...)
   * @returns {string} taskId
   */
  addTask(taskId, fn, metadata = {}) {
    // Khởi tạo trạng thái tác vụ
    this._tasks.set(taskId, {
      taskId,
      state: 'queued',       // queued | processing | completed | failed
      progress: 0,
      createdAt: new Date().toISOString(),
      ...metadata,
    });

    if (this.running < this.maxConcurrent) {
      // Có slot trống → chạy ngay
      this._executeTask(taskId, fn);
    } else if (this.queue.length < this.maxQueued) {
      // Hết slot → xếp hàng
      this.queue.push({ taskId, fn });
      console.log(`📋 [TaskQueue] Task ${taskId} queued. Queue size: ${this.queue.length}`);
    } else {
      // Hàng đợi đầy → từ chối (backpressure)
      // Giống MPT: "task queue is full, please try again later"
      this._tasks.delete(taskId);
      throw new TaskQueueFullError();
    }

    return taskId;
  }

  /**
   * Cập nhật tiến độ/trạng thái tác vụ — giống MPT state.update_task()
   * @param {string} taskId
   * @param {Object} updates - { progress, state, ... }
   */
  updateTask(taskId, updates = {}) {
    const task = this._tasks.get(taskId);
    if (task) {
      if (updates.progress !== undefined) {
        updates.progress = Math.min(Math.max(updates.progress, 0), 100);
      }
      Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    }
  }

  /**
   * Lấy trạng thái tác vụ theo ID — giống MPT state.get_task()
   * @param {string} taskId
   * @returns {Object|null}
   */
  getTask(taskId) {
    return this._tasks.get(taskId) || null;
  }

  /**
   * Lấy tất cả tác vụ (hỗ trợ phân trang) — giống MPT state.get_all_tasks()
   * @param {number} page
   * @param {number} pageSize
   * @returns {{ tasks: Object[], total: number }}
   */
  getAllTasks(page = 1, pageSize = 10) {
    const tasks = Array.from(this._tasks.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = (page - 1) * pageSize;
    return {
      tasks: tasks.slice(start, start + pageSize),
      total: tasks.length,
    };
  }

  /**
   * Xóa tác vụ khỏi state — giống MPT state.delete_task()
   * @param {string} taskId
   */
  deleteTask(taskId) {
    this._tasks.delete(taskId);
  }

  /**
   * Lấy thống kê nhanh về queue
   * @returns {{ running: number, queued: number, total: number }}
   */
  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      total: this._tasks.size,
      maxConcurrent: this.maxConcurrent,
      maxQueued: this.maxQueued,
    };
  }

  /**
   * @private
   * Thực thi tác vụ — giống MPT TaskManager.execute_task() + run_task()
   */
  async _executeTask(taskId, fn) {
    this.running++;
    this.updateTask(taskId, { state: 'processing', progress: 5 });
    console.log(`🚀 [TaskQueue] Task ${taskId} started. Running: ${this.running}/${this.maxConcurrent}`);

    try {
      // Truyền callback updateProgress để fn có thể báo tiến độ
      // Giống MPT state.update_task(task_id, progress=X) trong pipeline
      const result = await fn((progress) => {
        this.updateTask(taskId, { progress });
      });

      this.updateTask(taskId, {
        state: 'completed',
        progress: 100,
        result,
        completedAt: new Date().toISOString(),
      });
      console.log(`✅ [TaskQueue] Task ${taskId} completed.`);
    } catch (error) {
      this.updateTask(taskId, {
        state: 'failed',
        error: error.message,
        failedAt: new Date().toISOString(),
      });
      console.error(`❌ [TaskQueue] Task ${taskId} failed:`, error.message);
    } finally {
      // Giống MPT task_done() → check_queue()
      this.running--;
      this._checkQueue();
    }
  }

  /**
   * @private
   * Kiểm tra và chạy tác vụ tiếp theo từ queue — giống MPT check_queue()
   */
  _checkQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const { taskId, fn } = this.queue.shift();
      this._executeTask(taskId, fn);
    }
  }

  /**
   * @private
   * Dọn dẹp task đã hoàn thành/thất bại quá 1 giờ
   * Tránh memory leak khi có nhiều task xử lý xong nhưng không ai query
   */
  _cleanupOldTasks() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [taskId, task] of this._tasks.entries()) {
      if (
        (task.state === 'completed' || task.state === 'failed') &&
        new Date(task.updatedAt || task.createdAt).getTime() < oneHourAgo
      ) {
        this._tasks.delete(taskId);
      }
    }
  }

  /**
   * Cleanup khi shutdown server
   */
  destroy() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }
  }
}

// ===== Singleton instance — dùng chung cho toàn backend =====
// Config qua env vars, giống MPT đọc từ config.toml
export const taskQueue = new TaskQueueManager(
  parseInt(process.env.MAX_CONCURRENT_TASKS || '3'),
  parseInt(process.env.MAX_QUEUED_TASKS || '50')
);

import Notification from '../models/Notification.js';

/**
 * @route GET /api/notifications
 * @desc Lấy danh sách thông báo của user hiện tại
 * @access Authenticated users
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id?.toString() || req.user._id;
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await Notification.find({ userId });
    // Limit results
    const limited = notifications.slice(0, limit);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      success: true,
      notifications: limited,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route GET /api/notifications/unread-count
 * @desc Lấy số thông báo chưa đọc
 * @access Authenticated users
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id?.toString() || req.user._id;
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route PUT /api/notifications/:id/read
 * @desc Đánh dấu một thông báo đã đọc
 * @access Authenticated users
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
    }

    const userId = req.user._id?.toString() || req.user._id;
    if (notification.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Không có quyền.' });
    }

    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });

    res.json({ success: true, message: 'Đã đánh dấu đã đọc.' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route PUT /api/notifications/read-all
 * @desc Đánh dấu tất cả thông báo đã đọc
 * @access Authenticated users
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id?.toString() || req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });

    res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc.' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

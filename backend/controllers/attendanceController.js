import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import {
  countClubSessions,
  calculateAttendanceRate,
  isEligible,
  getQuarterRange,
  getQuarter,
  getCurrentQuarterRange,
  getNextSessions,
  getClubSessionDates
} from '../utils/attendanceUtils.js';

/**
 * @route   POST /api/attendance/mark
 * @desc    Điểm danh hàng loạt (Admin only)
 * @access  Private (Admin)
 */
export const markAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    // records: [{ userId, userName, maHoiVien, status, note }]

    if (!date || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày và danh sách điểm danh.'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày không hợp lệ (YYYY-MM-DD).'
      });
    }

    const attendanceList = records.map(r => ({
      userId: r.userId,
      userName: r.userName || '',
      maHoiVien: r.maHoiVien || '',
      date,
      status: r.status || 'present',
      note: r.note || '',
      markedBy: req.user._id.toString()
    }));

    await Attendance.bulkUpsert(attendanceList);

    res.status(200).json({
      success: true,
      message: `Đã điểm danh ${records.length} hội viên cho ngày ${date}.`,
      count: records.length
    });
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   GET /api/attendance?date=YYYY-MM-DD
 * @desc    Lấy danh sách điểm danh theo ngày
 * @access  Private (Admin)
 */
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày (date=YYYY-MM-DD).'
      });
    }

    const records = await Attendance.find({ date });

    res.json({
      success: true,
      date,
      count: records.length,
      records
    });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   GET /api/attendance/my
 * @desc    Lấy lịch sử điểm danh cá nhân (cho Member)
 * @access  Private
 */
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const records = await Attendance.find({ userId });

    // Calculate stats
    const { start, end } = getCurrentQuarterRange();
    const totalSessions = countClubSessions(start, end);
    
    const quarterRecords = records.filter(r => {
      return r.date >= start.toISOString().split('T')[0] && 
             r.date <= end.toISOString().split('T')[0];
    });

    const presentCount = quarterRecords.filter(r => r.status === 'present').length;
    const excusedCount = quarterRecords.filter(r => r.status === 'excused').length;
    const absentCount = quarterRecords.filter(r => r.status === 'absent').length;
    const rate = calculateAttendanceRate(presentCount, totalSessions);
    const eligible = isEligible(rate);

    res.json({
      success: true,
      records,
      stats: {
        currentQuarter: getQuarter(new Date()),
        totalSessions,
        presentCount,
        excusedCount,
        absentCount,
        attendanceRate: rate,
        isEligible: eligible,
        quarterStart: start.toISOString().split('T')[0],
        quarterEnd: end.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get My Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   GET /api/attendance/stats/:userId
 * @desc    Thống kê chuyên cần theo userId (Admin hoặc chính mình)
 * @access  Private
 */
export const getUserAttendanceStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await Attendance.find({ userId });

    const { start, end } = getCurrentQuarterRange();
    const totalSessions = countClubSessions(start, end);
    
    const quarterRecords = records.filter(r => {
      return r.date >= start.toISOString().split('T')[0] && 
             r.date <= end.toISOString().split('T')[0];
    });

    const presentCount = quarterRecords.filter(r => r.status === 'present').length;
    const excusedCount = quarterRecords.filter(r => r.status === 'excused').length;
    const absentCount = quarterRecords.filter(r => r.status === 'absent').length;
    const rate = calculateAttendanceRate(presentCount, totalSessions);
    const eligible = isEligible(rate);

    res.json({
      success: true,
      stats: {
        userId,
        currentQuarter: getQuarter(new Date()),
        totalSessions,
        presentCount,
        excusedCount,
        absentCount,
        attendanceRate: rate,
        isEligible: eligible,
        quarterStart: start.toISOString().split('T')[0],
        quarterEnd: end.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Get User Attendance Stats Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   POST /api/attendance/evaluate
 * @desc    Chạy đánh giá chuyên cần cho tất cả members (Admin trigger hoặc cron)
 * @access  Private (Admin)
 */
export const evaluateAttendance = async (req, res) => {
  try {
    const { quarter, year } = req.body;
    
    const now = new Date();
    const evalQuarter = quarter || getQuarter(now);
    const evalYear = year || now.getFullYear();
    const { start, end } = getQuarterRange(evalQuarter, evalYear);
    
    const totalSessions = countClubSessions(start, end);

    // Get all members
    const members = await User.find({ role: 'Member' });
    const results = [];

    for (const member of members) {
      const userId = (member._id || member.id).toString();
      const records = await Attendance.find({ userId });
      
      const quarterRecords = records.filter(r => {
        return r.date >= start.toISOString().split('T')[0] && 
               r.date <= end.toISOString().split('T')[0];
      });

      const presentCount = quarterRecords.filter(r => r.status === 'present').length;
      const rate = calculateAttendanceRate(presentCount, totalSessions);
      const eligible = isEligible(rate);

      // Update user status
      const status = eligible ? 'eligible' : 'ineligible';
      await User.findByIdAndUpdate(userId, {
        $set: {
          attendanceStatus: status,
          lastEvaluated: new Date().toISOString()
        }
      });

      results.push({
        userId,
        name: member.name,
        maHoiVien: member.maHoiVien,
        presentCount,
        totalSessions,
        rate,
        status
      });
    }

    res.json({
      success: true,
      message: `Đã đánh giá chuyên cần Q${evalQuarter}/${evalYear} cho ${results.length} hội viên.`,
      quarter: evalQuarter,
      year: evalYear,
      totalSessions,
      results
    });
  } catch (error) {
    console.error('Evaluate Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   GET /api/attendance/next-sessions
 * @desc    Lấy các buổi tập tiếp theo
 * @access  Private
 */
export const getUpcomingSessions = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 3;
    const sessions = getNextSessions(count);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get Upcoming Sessions Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   GET /api/attendance/all-members-stats
 * @desc    Lấy thống kê chuyên cần tất cả members (Admin)
 * @access  Private (Admin)
 */
export const getAllMembersAttendanceStats = async (req, res) => {
  try {
    const { start, end } = getCurrentQuarterRange();
    const totalSessions = countClubSessions(start, end);

    // Get all users (not just Members — include all)
    const allUsers = await User.find({});
    const allAttendance = await Attendance.find({});

    const stats = allUsers.map(user => {
      const userId = (user._id || user.id).toString();
      const userRecords = allAttendance.filter(r => r.userId === userId);
      
      const quarterRecords = userRecords.filter(r => {
        return r.date >= start.toISOString().split('T')[0] && 
               r.date <= end.toISOString().split('T')[0];
      });

      const presentCount = quarterRecords.filter(r => r.status === 'present').length;
      const excusedCount = quarterRecords.filter(r => r.status === 'excused').length;
      const absentCount = quarterRecords.filter(r => r.status === 'absent').length;
      const rate = calculateAttendanceRate(presentCount, totalSessions);

      return {
        userId,
        name: user.name,
        email: user.email,
        maHoiVien: user.maHoiVien || '',
        role: user.role,
        avatarUrl: user.avatarUrl || '',
        presentCount,
        excusedCount,
        absentCount,
        totalSessions,
        attendanceRate: rate,
        isEligible: isEligible(rate),
        attendanceStatus: user.attendanceStatus || 'pending'
      };
    });

    res.json({
      success: true,
      quarter: getQuarter(new Date()),
      year: new Date().getFullYear(),
      totalSessions,
      stats
    });
  } catch (error) {
    console.error('Get All Members Stats Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

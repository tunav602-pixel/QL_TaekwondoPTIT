/**
 * Attendance Utilities
 * Logic tính toán tỉ lệ chuyên cần CLB Taekwondo PTIT
 * 
 * Lịch hoạt động: Thứ 3, Thứ 5, Chủ Nhật (3 buổi/tuần)
 * Chu kỳ đánh giá: 3 tháng (Quý)
 * Ngưỡng đạt: >= 2/3 (~66.67%)
 */

// Ngày trong tuần CLB hoạt động (0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7)
const CLUB_DAYS = [0, 2, 4]; // Chủ Nhật, Thứ 3, Thứ 5

/**
 * Tính tổng số buổi CLB hoạt động trong khoảng thời gian
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {number} Tổng số buổi
 */
export const countClubSessions = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    if (CLUB_DAYS.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * Lấy danh sách ngày CLB hoạt động trong khoảng thời gian
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string[]} Danh sách ngày (YYYY-MM-DD)
 */
export const getClubSessionDates = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    if (CLUB_DAYS.includes(current.getDay())) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

/**
 * Xác định quý (Quarter) dựa trên ngày
 * Q1: T1-T3, Q2: T4-T6, Q3: T7-T9, Q4: T10-T12
 */
export const getQuarter = (date) => {
  const d = new Date(date);
  const month = d.getMonth(); // 0-indexed
  return Math.floor(month / 3) + 1;
};

/**
 * Lấy khoảng thời gian của quý hiện tại
 * @param {number} quarter 1-4
 * @param {number} year 
 * @returns {{ start: Date, end: Date }}
 */
export const getQuarterRange = (quarter, year) => {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0); // Last day of quarter
  return { start, end };
};

/**
 * Lấy khoảng thời gian quý hiện tại
 */
export const getCurrentQuarterRange = () => {
  const now = new Date();
  const quarter = getQuarter(now);
  return getQuarterRange(quarter, now.getFullYear());
};

/**
 * Tính tỉ lệ chuyên cần
 * @param {number} presentCount Số buổi đi học
 * @param {number} totalSessions Tổng số buổi CLB hoạt động
 * @returns {number} Tỉ lệ 0-100
 */
export const calculateAttendanceRate = (presentCount, totalSessions) => {
  if (totalSessions === 0) return 100;
  return Math.round((presentCount / totalSessions) * 10000) / 100;
};

/**
 * Kiểm tra hội viên có đủ điều kiện không
 * @param {number} rate Tỉ lệ chuyên cần (0-100)
 * @returns {boolean}
 */
export const isEligible = (rate) => {
  return rate >= 66.67; // >= 2/3
};

/**
 * Lấy 3 buổi tập tiếp theo
 * @returns {Array<{date: string, dayName: string}>}
 */
export const getNextSessions = (count = 3) => {
  const sessions = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  
  // Start from tomorrow
  current.setDate(current.getDate() + 1);
  
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  
  while (sessions.length < count) {
    if (CLUB_DAYS.includes(current.getDay())) {
      sessions.push({
        date: current.toISOString().split('T')[0],
        dayName: dayNames[current.getDay()],
        dayOfWeek: current.getDay()
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return sessions;
};

export default {
  CLUB_DAYS,
  countClubSessions,
  getClubSessionDates,
  getQuarter,
  getQuarterRange,
  getCurrentQuarterRange,
  calculateAttendanceRate,
  isEligible,
  getNextSessions
};

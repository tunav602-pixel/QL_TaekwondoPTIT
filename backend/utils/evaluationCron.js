import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import {
  countClubSessions,
  calculateAttendanceRate,
  isEligible,
  getQuarterRange,
  getQuarter,
  getCurrentQuarterRange
} from './attendanceUtils.js';

/**
 * Auto-evaluate attendance for all members
 * This runs as a cron-like job on the server
 * Cycle: checks daily, evaluates at end of each quarter
 */

/**
 * Run evaluation for a specific quarter
 */
const evaluateQuarter = async (quarter, year) => {
  const { start, end } = getQuarterRange(quarter, year);
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

  return results;
};

/**
 * Check if today is end of quarter and trigger evaluation
 */
const checkAndEvaluate = async () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1; // 1-indexed

  // Quarter end dates: Mar 31, Jun 30, Sep 30, Dec 31
  const isQuarterEnd = (
    (month === 3 && day === 31) ||
    (month === 6 && day === 30) ||
    (month === 9 && day === 30) ||
    (month === 12 && day === 31)
  );

  if (isQuarterEnd) {
    const quarter = getQuarter(now);
    const year = now.getFullYear();
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 AUTO-EVALUATION: Q${quarter}/${year}`);
    console.log('='.repeat(60));

    try {
      const results = await evaluateQuarter(quarter, year);
      
      const eligible = results.filter(r => r.status === 'eligible').length;
      const ineligible = results.filter(r => r.status === 'ineligible').length;
      
      console.log(`✅ Đã đánh giá ${results.length} hội viên`);
      console.log(`   - Đủ điều kiện: ${eligible}`);
      console.log(`   - Không đủ ĐK: ${ineligible}`);
      console.log('='.repeat(60) + '\n');
    } catch (error) {
      console.error('❌ Auto-evaluation error:', error);
    }
  }
};

/**
 * Start the evaluation cron job
 * Runs every 24 hours, checks if it's end of quarter
 */
export const startEvaluationCron = () => {
  console.log('⏰ Attendance evaluation cron initialized (checks daily)');

  // Check immediately on startup (in case server restarts on quarter-end day)
  setTimeout(() => {
    checkAndEvaluate();
  }, 5000); // Wait 5s after startup

  // Then check every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(checkAndEvaluate, TWENTY_FOUR_HOURS);
};

export default { startEvaluationCron };

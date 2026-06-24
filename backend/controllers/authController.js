import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import User from '../models/User.js';

/**
 * Tạo JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * Format user data để trả về client (loại bỏ password)
 */
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  subRole: user.subRole || '',
  maHoiVien: user.maHoiVien || '',
  avatarUrl: user.avatarUrl,
  phone: user.phone || '',
  dob: user.dob || '',
  gender: user.gender || 'Nam',
  studentId: user.studentId || '',
  attendanceStatus: user.attendanceStatus || 'pending',
  lastEvaluated: user.lastEvaluated || ''
});

/**
 * Generate 6-digit OTP code
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Khởi tạo Resend client
 */
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY chưa được cấu hình!');
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Tạo HTML template cho email OTP
 */
const buildOTPHtml = (userName, otpCode) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 6px 0; font-weight: 800; letter-spacing: 1px;">🥋 TAEKWONDO PTIT</h1>
      <p style="color: #93c5fd; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Hệ Thống Quản Lý Tài Chính CLB</p>
    </div>
    <div style="padding: 32px 28px;">
      <p style="color: #334155; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
        Xin chào <strong style="color: #1e3a8a;">${userName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
        Bạn vừa yêu cầu đăng nhập vào hệ thống quản lý tài chính CLB Taekwondo PTIT. Đây là mã xác thực OTP của bạn:
      </p>
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Mã OTP của bạn</p>
        <p style="color: #1e3a8a; font-size: 36px; font-weight: 900; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</p>
      </div>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 16px; margin: 0 0 24px 0;">
        <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
          ⏱️ Mã OTP có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
        </p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
      </p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; text-align: center;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        © 2026 Taekwondo PTIT Club — Hệ thống quản lý tài chính CLB
      </p>
    </div>
  </div>
`;

/**
 * Gửi OTP qua Resend (không bị chặn bởi Cloud platforms)
 */
const sendOTPEmail = async (email, otpCode, userName) => {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`⚠️ Resend chưa cấu hình. OTP for ${email}: ${otpCode}`);
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Taekwondo PTIT <onboarding@resend.dev>',
      to: [email],
      subject: '🔐 Mã OTP Đăng Nhập - Taekwondo PTIT Finance',
      html: buildOTPHtml(userName, otpCode)
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log(`✅ OTP email sent via Resend to ${email} | ID: ${data.id}`);
    return true;
  } catch (err) {
    console.error('❌ Resend exception:', err.message);
    return false;
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới (Regular Members only)
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, maHoiVien } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự.'
      });
    }

    // Check email đã tồn tại
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký.'
      });
    }

    // Hash password với bcrypt (12 rounds)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Xử lý avatar URL nếu có upload file
    let avatarUrl = '';
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    // Tạo user mới - Default role is Member
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatarUrl,
      role: 'Member',
      subRole: '',
      ...(maHoiVien && { maHoiVien })
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      user: formatUser(user),
      token
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập - Phase 1: Email/Password validation
 *          - Regular Members: Direct login with JWT
 *          - Admins (Super-Admin & Sub-Admin): Generate OTP, require verification
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('\n🔐 LOGIN ATTEMPT');
    console.log('Email:', email);
    console.log('Password length:', password?.length);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu.'
      });
    }

    // Tìm user theo email
    console.log('🔍 Looking for user:', email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng.'
      });
    }

    console.log('✅ User found:', user.name, '- Role:', user.role);

    // So sánh password
    console.log('🔐 Comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng.'
      });
    }

    // Check if user is Admin (Super-Admin or Sub-Admin)
    const isAdmin = user.role === 'Super-Admin' || user.role === 'Sub-Admin';

    if (isAdmin) {
      // ADMIN LOGIN: Generate OTP and send via email
      const otpCode = generateOTP();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save OTP to database
      await User.findByIdAndUpdate(user._id, {
        $set: { otpCode, otpExpires }
      });

      // Gửi OTP qua email bất đồng bộ (fire-and-forget)
      // Không await để response login trả về ngay lập tức, không chờ SMTP
      sendOTPEmail(user.email, otpCode, user.name).catch(err => {
        console.error('❌ Background email send failed:', err.message);
      });

      return res.status(200).json({
        success: true,
        requireOTP: true,
        message: 'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        userId: user._id,
        email: user.email,
        otpCode: otpCode
      });
    } else {
      // REGULAR MEMBER LOGIN: Direct login with JWT
      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        requireOTP: false,
        message: 'Đăng nhập thành công!',
        user: formatUser(user),
        token
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP for Admin login - Phase 2
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  try {
    const { userId, otpCode } = req.body;

    console.log('\n🔐 VERIFY OTP ATTEMPT');
    console.log('UserId:', userId);
    console.log('OTP Code received:', otpCode);

    if (!userId || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã OTP.'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại.'
      });
    }

    console.log('✅ User found:', user.name);
    console.log('📦 Stored OTP:', user.otpCode);
    console.log('⏱️  OTP Expires:', user.otpExpires);
    console.log('⏱️  Now:', new Date());

    // Check OTP expiration — ensure Date comparison is correct
    const expiresDate = user.otpExpires ? new Date(user.otpExpires) : null;
    if (!expiresDate || new Date() > expiresDate) {
      console.log('❌ OTP expired');
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }

    // Verify OTP — trim both sides for safety
    const storedOTP = (user.otpCode || '').trim();
    const receivedOTP = (otpCode || '').trim();
    
    if (storedOTP !== receivedOTP) {
      console.log('❌ OTP mismatch. Stored:', storedOTP, 'Received:', receivedOTP);
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác.'
      });
    }

    console.log('✅ OTP verified successfully!');

    // Clear OTP after successful verification
    await User.findByIdAndUpdate(userId, {
      $set: { otpCode: '', otpExpires: null }
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Xác thực OTP thành công! Đăng nhập hoàn tất.',
      user: formatUser(user),
      token
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP for Admin login
 * @access  Public
 */
export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin người dùng.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại.'
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update OTP in database
    await User.findByIdAndUpdate(userId, {
      $set: { otpCode, otpExpires }
    });

    // Gửi OTP qua email bất đồng bộ (fire-and-forget)
    sendOTPEmail(user.email, otpCode, user.name).catch(err => {
      console.error('❌ Background resend email failed:', err.message);
    });

    res.status(200).json({
      success: true,
      message: 'Mã OTP mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      otpCode: otpCode
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất (stateless JWT - chủ yếu xử lý ở client)
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công!'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server.'
    });
  }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Lấy thông tin profile user hiện tại
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: formatUser(req.user)
    });
  } catch (error) {
    console.error('GetProfile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server.'
    });
  }
};

/**
 * @route   POST /api/auth/seed-super-admin
 * @desc    Seed Super Admin account (tunav602@gmail.com) - Run once
 * @access  Public (Should be protected in production or run via script)
 */
export const seedSuperAdmin = async (req, res) => {
  try {
    const SUPER_ADMIN_EMAIL = 'tunav602@gmail.com';
    const SUPER_ADMIN_PASSWORD = 'Tuanvietnguyen123';
    const SUPER_ADMIN_NAME = 'Tuấn Việt Nguyễn';

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super Admin đã tồn tại trong hệ thống.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);

    // Create Super Admin
    const superAdmin = await User.create({
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'Super-Admin',
      subRole: '',
      avatarUrl: ''
    });

    res.status(201).json({
      success: true,
      message: 'Super Admin đã được tạo thành công!',
      user: formatUser(superAdmin)
    });
  } catch (error) {
    console.error('Seed Super Admin Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo Super Admin.'
    });
  }
};

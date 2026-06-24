import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Helper to format user details
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  subRole: user.subRole || '',
  maHoiVien: user.maHoiVien || '',
  phone: user.phone || '',
  dob: user.dob || '',
  gender: user.gender || 'Nam',
  studentId: user.studentId || '',
  avatarUrl: user.avatarUrl || '',
  attendanceStatus: user.attendanceStatus || 'pending',
  lastEvaluated: user.lastEvaluated || '',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

/**
 * @route   GET /api/users/profile
 * @desc    Lấy thông tin profile của user hiện tại
 * @access  Private
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }
    res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    console.error('getMyProfile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Lấy thông tin profile của một user bất kỳ theo ID
 * @access  Private
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }
    res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Cập nhật thông tin cá nhân của user hiện tại (bao gồm avatar)
 * @access  Private
 */
export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, dob, gender, studentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Họ tên không được để trống.' });
    }

    const updateData = {
      name,
      phone: phone || '',
      dob: dob || '',
      gender: gender || 'Nam',
      studentId: studentId || ''
    };

    // Handle avatar upload if file is present
    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Cập nhật thông tin của một user bất kỳ theo ID (bao gồm avatar)
 * @access  Private
 */
export const updateUserById = async (req, res) => {
  try {
    const { name, phone, dob, gender, studentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Họ tên không được để trống.' });
    }

    // Kiểm tra quyền: Chỉ cho phép tự sửa hoặc người có quyền Admin sửa của người khác
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'Super-Admin' && req.user.role !== 'Sub-Admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    const updateData = {
      name,
      phone: phone || '',
      dob: dob || '',
      gender: gender || 'Nam',
      studentId: studentId || ''
    };

    // Handle avatar upload if file is present
    if (req.file) {
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('updateUserById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   PUT /api/users/:id/role
 * @desc    Cập nhật vai trò/chức vụ của thành viên (Chỉ dành cho Super Admin)
 * @access  Private (Super Admin only)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role, subRole } = req.body;

    const validRoles = ['Super-Admin', 'Sub-Admin', 'Member'];
    const validSubRoles = ['', 'Chủ nhiệm', 'Ban chuyên môn', 'Ban tài chính', 'Ban sự kiện', 'Ban nhân sự', 'Ban truyền thông'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }

    if (subRole && !validSubRoles.includes(subRole)) {
      return res.status(400).json({ success: false, message: 'Chức vụ không hợp lệ.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role, subRole: subRole || '' } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    res.json({
      success: true,
      message: `Đã thay đổi quyền thành công!`,
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   POST /api/users/register-sub-admin
 * @desc    Đăng ký Sub-Admin mới (Chỉ Super Admin được phép)
 * @access  Private (Super Admin only)
 */
export const registerSubAdmin = async (req, res) => {
  try {
    const { name, email, password, subRole } = req.body;

    // Validate input
    if (!name || !email || !password || !subRole) {
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

    const validSubRoles = ['Chủ nhiệm', 'Ban chuyên môn', 'Ban tài chính', 'Ban sự kiện', 'Ban nhân sự', 'Ban truyền thông'];
    if (!validSubRoles.includes(subRole)) {
      return res.status(400).json({
        success: false,
        message: 'Chức vụ Sub-Admin không hợp lệ.'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Sub-Admin
    const subAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'Sub-Admin',
      subRole,
      avatarUrl: ''
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký Sub-Admin thành công!',
      user: formatUser(subAdmin)
    });
  } catch (error) {
    console.error('Register Sub-Admin Error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * @route   GET /api/users/sub-admins
 * @desc    Lấy danh sách tất cả Sub-Admins (Chỉ Super Admin được phép)
 * @access  Private (Super Admin only)
 */
export const getAllSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: 'Sub-Admin' });
    res.json({
      success: true,
      count: subAdmins.length,
      subAdmins: subAdmins.map(formatUser)
    });
  } catch (error) {
    console.error('Get All Sub-Admins Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   GET /api/users/members
 * @desc    Lấy danh sách tất cả Members (Chỉ Super Admin được phép)
 * @access  Private (Super Admin only)
 */
export const getAllMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'Member' });
    res.json({
      success: true,
      count: members.length,
      members: members.map(formatUser)
    });
  } catch (error) {
    console.error('Get All Members Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route   PUT /api/users/:id/promote
 * @desc    Nâng quyền Member → Sub-Admin (Chỉ Super Admin)
 * @access  Private (Super Admin only)
 */
export const promoteToAdmin = async (req, res) => {
  try {
    const { subRole } = req.body;

    const validSubRoles = ['Chủ nhiệm', 'Ban chuyên môn', 'Ban tài chính', 'Ban sự kiện', 'Ban nhân sự', 'Ban truyền thông'];
    if (!subRole || !validSubRoles.includes(subRole)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn chức vụ hợp lệ cho Admin.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (user.role !== 'Member') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể nâng quyền cho Thành viên.'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: 'Sub-Admin', subRole } },
      { new: true }
    );

    res.json({
      success: true,
      message: `Đã nâng quyền ${updatedUser.name} lên Sub-Admin (${subRole})!`,
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('promoteToAdmin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   PUT /api/users/:id/demote
 * @desc    Hạ quyền Sub-Admin → Member (Chỉ Super Admin)
 * @access  Private (Super Admin only)
 */
export const demoteToMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (user.role !== 'Sub-Admin') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hạ quyền Sub-Admin.'
      });
    }

    // Không cho phép hạ quyền chính mình
    if (user.email === req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể hạ quyền chính mình.'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: 'Member', subRole: '' } },
      { new: true }
    );

    res.json({
      success: true,
      message: `Đã hạ quyền ${updatedUser.name} xuống Thành viên!`,
      user: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('demoteToMember error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMyProfile, getUserById, updateMyProfile, updateUserById, updateUserRole, registerSubAdmin, getAllSubAdmins, getAllMembers, promoteToAdmin, demoteToMember } from '../controllers/userController.js';
import authMiddleware, { isSuperAdmin } from '../middlewares/authMiddleware.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Cấu hình Multer cho avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// Tất cả các route về user đều được bảo vệ bởi authMiddleware
router.use(authMiddleware);

// Endpoint lấy và cập nhật profile của chính mình
router.get('/profile', getMyProfile);
router.put('/profile', upload.single('avatar'), updateMyProfile);

// Super Admin only endpoints
router.post('/register-sub-admin', isSuperAdmin, registerSubAdmin);
router.get('/sub-admins', isSuperAdmin, getAllSubAdmins);
router.get('/members', isSuperAdmin, getAllMembers);

// Role management (Super Admin only)
router.put('/:id/promote', isSuperAdmin, promoteToAdmin);
router.put('/:id/demote', isSuperAdmin, demoteToMember);
router.put('/:id/role', isSuperAdmin, updateUserRole);

// Endpoint lấy và cập nhật thông tin thành viên khác (with avatar upload support)
router.get('/:id', getUserById);
router.put('/:id', upload.single('avatar'), updateUserById);

export default router;

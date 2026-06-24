# 🥋 Taekwondo PTIT Finance Management System

> Hệ thống quản lý tài chính chuyên nghiệp cho Câu lạc bộ Taekwondo PTIT

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)](https://reactjs.org)

## ✨ Tính Năng Nổi Bật

### 🔐 Authentication & Security
- **Two-Factor Authentication (OTP)** cho Admin accounts
- **Role-Based Access Control (RBAC)** với 3 cấp độ
- JWT Token authentication
- Bcrypt password hashing (12 rounds)

### 👥 User Management
- **Super Admin**: Quyền cao nhất, quản lý toàn bộ hệ thống
- **Sub-Admin**: Quản lý các ban chức năng (Tài chính, Nhân sự, etc.)
- **Member**: Thành viên thường, xem thông tin

### 💰 Financial Management
- Dashboard tổng quan thu chi
- Thêm/Sửa/Xóa giao dịch (Admin only)
- Lịch sử thu/chi chi tiết
- Thống kê theo thời gian

### 🎨 Modern UI/UX
- Responsive design (Mobile, Tablet, Desktop)
- Dynamic navbar theo role
- Avatar upload với preview
- Clean & Professional interface

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- npm hoặc yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd taekwondo-ptit-finance

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
App: http://localhost:5173

### Default Accounts

**Super Admin:**
- Email: `tunav602@gmail.com`
- Password: `Tuanvietnguyen123`
- OTP: Check backend console

**Member:**
- Email: `nmhtaekwondoptit@gmail.com`
- Password: `123456`

## 🏗️ Tech Stack

### Frontend
- **React 18.3.1** - UI Framework
- **React Router 7.1.3** - Routing
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Toastify** - Notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **MongoDB/Mongoose** - Database
- **JWT** - Authentication
- **Bcrypt** - Password Hashing
- **Multer** - File Upload

## 📁 Project Structure

```
taekwondo-ptit-finance/
├── backend/
│   ├── config/          # Database config
│   ├── controllers/     # Business logic
│   ├── middlewares/     # Auth & validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   ├── uploads/         # Avatar uploads
│   └── server.js        # Entry point
├── src/
│   ├── assets/          # Images & static files
│   ├── components/      # Reusable components
│   ├── lib/             # Utilities (axios config)
│   ├── pages/           # Page components
│   ├── store/           # Zustand stores
│   └── App.jsx          # Main app component
└── public/              # Public assets
```

## 🔑 Key Features Breakdown

### 1. OTP Authentication
- Admin accounts require OTP verification
- OTP expires after 5 minutes
- Resend OTP functionality
- Email delivery (mock in dev, real in production)

### 2. Role-Based Access Control

| Feature | Super Admin | Sub-Admin | Member |
|---------|-------------|-----------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| Add/Edit/Delete Transactions | ✅ | ✅ | ❌ |
| View Transaction History | ✅ | ✅ | ✅ (Read-only) |
| Register Sub-Admins | ✅ | ❌ | ❌ |
| Update Profile & Avatar | ✅ | ✅ | ✅ |

### 3. Admin Registration
- Super Admin can create Sub-Admin accounts
- Assign roles: Ban Tài Chính, Ban Nhân Sự, etc.
- View list of all Sub-Admins
- Protected route (Super Admin only)

### 4. Profile Management
- Update personal information
- Upload avatar (JPEG, PNG, WebP)
- Real-time preview
- File validation (type & size)

## 🔒 Security Features

- ✅ JWT Token authentication
- ✅ Password hashing with bcrypt
- ✅ OTP-based 2FA for Admins
- ✅ Role-based route protection
- ✅ File upload validation
- ✅ XSS protection
- ✅ CORS configuration

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register           - Register new member
POST   /api/auth/login              - Login (Phase 1)
POST   /api/auth/verify-otp         - Verify OTP (Phase 2)
POST   /api/auth/resend-otp         - Resend OTP
POST   /api/auth/logout             - Logout
GET    /api/auth/profile            - Get current user
```

### User Management
```
GET    /api/users/profile           - Get my profile
PUT    /api/users/profile           - Update my profile (with avatar)
GET    /api/users/:id               - Get user by ID
PUT    /api/users/:id               - Update user by ID
PUT    /api/users/:id/role          - Update user role (Super Admin only)
POST   /api/users/register-sub-admin - Create Sub-Admin (Super Admin only)
GET    /api/users/sub-admins        - Get all Sub-Admins (Super Admin only)
```

## 🧪 Testing

### Manual Testing Checklist
- ✅ Member login (no OTP)
- ✅ Admin login (with OTP)
- ✅ OTP verification
- ✅ Profile update
- ✅ Avatar upload
- ✅ Admin registration
- ✅ Role-based access control

### Future Enhancements
- [ ] Automated unit tests
- [ ] Integration tests
- [ ] E2E tests with Cypress

## 🚀 Deployment

### Environment Variables

Create `.env` file in `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taekwondo-ptit
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development

# Email Configuration (Production)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Production Recommendations

1. **Email Service**: Configure real email service (Nodemailer, SendGrid)
2. **Cloud Storage**: Use AWS S3 or Cloudinary for avatars
3. **Database**: Use MongoDB Atlas for production
4. **Security**: Enable HTTPS, add rate limiting
5. **Monitoring**: Setup error tracking (Sentry, LogRocket)

## 📝 Scripts

### Backend
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run seed:super-admin # Create Super Admin account
```

### Frontend
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Tuấn Việt Nguyễn
- **Organization**: Taekwondo PTIT Club
- **Contact**: tunav602@gmail.com

## 🙏 Acknowledgments

- Taekwondo PTIT Club members
- PTIT (Posts and Telecommunications Institute of Technology)
- All contributors and supporters

---

<div align="center">
  <strong>Made with ❤️ for Taekwondo PTIT</strong>
  <br>
  <sub>© 2026 Taekwondo PTIT Finance Management System</sub>
</div>

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

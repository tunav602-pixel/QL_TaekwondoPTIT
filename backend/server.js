import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import appConfig from './config/appConfig.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { startEvaluationCron } from './utils/evaluationCron.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

// ES module __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ===== Middlewares =====

// CORS - cho phép tất cả localhost (dev mode) và các origins được cấu hình trong env
app.use(cors({
  origin: function (origin, callback) {
    // Cho phép requests không có origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    // Cho phép các domain được cấu hình trong CORS_ORIGINS (như custom domain, vercel domain)
    if (appConfig.security.corsOrigins && appConfig.security.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Cho phép tất cả localhost với bất kỳ port nào
    if (/^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON body
app.use(express.json());

// Serve static files (avatars & bills)
app.use('/uploads', express.static(path.join(__dirname, 'uploads/bills')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);

// TEMP DEBUG ENDPOINT - xóa sau khi fix xong
app.get('/api/debug/status', (req, res) => {
  const mongoUri = process.env.MONGO_URI || '';
  // Ẩn password khỏi URI để log an toàn
  const safeUri = mongoUri.replace(/:([^@]+)@/, ':***@');
  res.json({
    isMongoConnected: global.isMongoConnected,
    mongoUriMasked: safeUri || 'KHÔNG CÓ (MONGO_URI chưa được set!)',
    hasResendKey: !!process.env.RESEND_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Health check — enhanced với project info (giống MoneyPrinterTurbo)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server đang hoạt động! 🥋',
    project: appConfig.projectName,
    version: appConfig.projectVersion,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại.' });
});

// Global error handler — Port từ MoneyPrinterTurbo asgi.py exception_handler
// Đặt SAU tất cả routes, xử lý tập trung mọi loại lỗi
app.use(globalErrorHandler);

// ===== Start Server =====
const startServer = async () => {
  await connectDB();
  app.listen(appConfig.port, () => {
    console.log(`\n🥋 ${appConfig.projectName} v${appConfig.projectVersion}`);
    console.log(`🚀 Server running on http://localhost:${appConfig.port}`);
    console.log(`📡 API Base: http://localhost:${appConfig.port}/api`);
    console.log(`📋 Task Queue: max ${appConfig.taskQueue.maxConcurrent} concurrent\n`);
    
    // Start auto-evaluation cron job
    startEvaluationCron();
  });
};

startServer();

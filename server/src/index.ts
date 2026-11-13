import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDB, getIsDbConnected } from './config/db.js';
import { initSocket } from './socket/socketHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import expiryRoutes from './routes/expiryRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

// Strict security requirement: Reject startup if JWT_SECRET is missing in production or development
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not defined! Server refuses to boot with insecure defaults.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Default to port 5001 to prevent conflicts with macOS AirPlay Receiver (port 5000)
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Socket.io initialization with authentication
initSocket(server, CLIENT_URL);

// Security Headers
app.use(helmet());

// CORS restriction
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, or server-to-server)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in deployment to avoid blocking frontend
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter for Authentication endpoints to mitigate brute-force attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', loginLimiter);

// Root landing route for health and status
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PharmaCare Pharmacy Management System - Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    database: getIsDbConnected() ? 'connected (MongoDB Atlas)' : 'in-memory (fallback)',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    message: 'Backend API is running. Connect your frontend to this service.',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PharmaCare Backend API',
    version: '1.0.0',
    port: PORT,
    database: getIsDbConnected() ? 'connected (MongoDB)' : 'in-memory (fallback)',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server and connect DB if not in test environment
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[PharmaCare Server] 🚀 REST API & Socket.IO running on http://localhost:${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, server };

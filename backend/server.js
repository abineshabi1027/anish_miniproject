const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { initSocket } = require('./sockets/queueSocket');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize real-time Socket.IO
const io = initSocket(server);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (helpful for demonstration)
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Import API routes
const authRoutes = require('./routes/authRoutes');
const orgRoutes = require('./routes/orgRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const queueRoutes = require('./routes/queueRoutes');
const notifRoutes = require('./routes/notifRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'QueueLess API Server',
    timestamp: new Date().toISOString()
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 QUEUELESS SERVER RUNNING ON PORT ${PORT}`);
  console.log(`⚡ Socket.IO Ready for Real-Time Queue Updates`);
  console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const authRoutes = require('./src/routes/auth');
const activityRoutes = require('./src/routes/activities');
const planRoutes = require('./src/routes/plans');
const attendanceRoutes = require('./src/routes/attendance');
const reactivationRoutes = require('./src/routes/reactivation');
const chatRoutes = require('./src/routes/chat');
const foundersRoutes = require('./src/routes/founders');
const dashboardRoutes = require('./src/routes/dashboard');
const profileRoutes = require('./src/routes/profile');

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL // Add your production URL in .env
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

// ==================== SECURITY MIDDLEWARE ====================

// Set security HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - Auth endpoints (stricter: 10 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        message: 'Too many login attempts, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting - Password reset (very strict: 5 requests per hour)
const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        message: 'Too many password reset attempts, please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy does not allow access from this origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser with size limit
app.use(express.json({ limit: '5mb' })); // For avatar uploads
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ==================== ROUTES ====================

// Apply stricter rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/request-reset', resetLimiter);
app.use('/api/auth/reset-password', resetLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reactivation', reactivationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/founders', foundersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Zevenz API is running', security: 'enabled' });
});

// Socket.io connection (for chat)
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

// Import attendance cron job
const { initAttendanceCron } = require('./src/jobs/attendanceCron');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ message: 'Something went wrong' });
    } else {
        res.status(500).json({ message: err.message });
    }
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');

        // Initialize attendance cron job
        initAttendanceCron();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log('Security features enabled: helmet, rate-limiting, CORS, mongoSanitize, XSS protection');
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

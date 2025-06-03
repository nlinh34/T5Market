// app.js:
// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Create Express app
const app = express();

// Load environment variables
require('dotenv').config();

// Connect to database
const connectDB = require('./config/database');
connectDB();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// JavaScript files with proper MIME type
app.use('/js', express.static(path.join(__dirname, 'public/js'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Add view helpers before routes
app.use((req, res, next) => {
    // Add basic helpers
    res.locals.formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    res.locals.formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    next();
});

// Add other view helpers
app.use(require('./middleware/viewHelpers'));

// Layout setup
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layouts/admin');

// Auth middleware
const authMiddleware = require('./middleware/auth');

// Routes
const adminAuthRoutes = require('./routes/admin/auth');
const adminDashboardRoutes = require('./routes/admin/dashboard');
const adminProductRoutes = require('./routes/admin/products');
const adminCategoryRoutes = require('./routes/admin/categories');
const adminOrderRoutes = require('./routes/admin/orders');
const adminUserRoutes = require('./routes/admin/users');
const adminReviewRoutes = require('./routes/admin/reviews');

// Admin routes
app.use('/admin/auth', adminAuthRoutes);
app.use('/admin', authMiddleware.requireAuth, adminDashboardRoutes);
app.use('/admin/products', authMiddleware.requireAuth, adminProductRoutes);
app.use('/admin/categories', authMiddleware.requireAuth, adminCategoryRoutes);
app.use('/admin/orders', authMiddleware.requireAuth, adminOrderRoutes);
app.use('/admin/users', authMiddleware.requireAuth, adminUserRoutes);
app.use('/admin/reviews', authMiddleware.requireAuth, adminReviewRoutes);

// Redirect routes
app.get('/admin/login', (req, res) => {
    res.redirect('/admin/auth/login');
});

app.get('/', (req, res) => {
    res.redirect('/admin/auth/login');
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('admin/error', {
        title: 'Lỗi 404',
        message: 'Trang không tồn tại'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('admin/error', {
        title: 'Lỗi 500',
        message: 'Có lỗi xảy ra: ' + err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Đang đóng server...');
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = app;
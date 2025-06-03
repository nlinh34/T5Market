const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.session.token;
        
        if (!token) {
            return res.status(401).json({ message: 'Token không tồn tại' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Người dùng không hợp lệ' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Yêu cầu đăng nhập' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }

        next();
    };
};

const adminAuth = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'ADMIN') {
        return next();
    }
    res.redirect('/admin/login');
};

const requireAuth = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/admin/auth/login');
        }

        // Fetch user and attach to request
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/admin/auth/login');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).render('admin/error', {
            title: 'Lỗi 500',
            message: 'Lỗi xác thực người dùng'
        });
    }
};

const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

module.exports = { authenticate, requireRole, adminAuth, requireAuth, redirectIfAuthenticated };
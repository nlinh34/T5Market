// controllers/admin/dashboardController.js:
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Payment = require('../../models/Payment');
const moment = require('moment');

const dashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: { $ne: 'ADMIN' } });
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const pendingProducts = await Product.countDocuments({ status: 'PENDING' });
        const pendingOrders = await Order.countDocuments({ status: 'PENDING_PAYMENT' });

        const monthlyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: moment().subtract(12, 'months').toDate() }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const recentOrders = await Order.find()
            .populate('buyer', 'fullName email')
            .populate('product', 'name price')
            .sort('-createdAt')
            .limit(10);

        res.render('admin/dashboard', {
            title: 'Dashboard',
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                pendingProducts,
                pendingOrders
            },
            monthlyStats,
            recentOrders
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('admin/error', { message: 'Lỗi server' });
    }
};

module.exports = { dashboard };
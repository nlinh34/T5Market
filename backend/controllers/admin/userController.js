const User = require('../../models/User');

const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const filter = { role: { $ne: 'ADMIN' } };
        if (req.query.role) filter.role = req.query.role;
        if (req.query.status) filter.isActive = req.query.status === 'active';

        // Thêm phần tính toán stats
        const stats = {
            total: await User.countDocuments({ role: { $ne: 'ADMIN' } }),
            sellers: await User.countDocuments({ role: 'SELLER' }),
            buyers: await User.countDocuments({ role: 'BUYER' }),
            blocked: await User.countDocuments({ isActive: false })
        };

        const users = await User.find(filter)
            .select('-password')
            .sort('-createdAt')
            .limit(limit)
            .skip(skip);

        const total = await User.countDocuments(filter);

        res.render('admin/users/index', {
            title: 'Quản lý người dùng',
            users,
            stats, // Thêm stats vào đây
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            },
            query: req.query,
            formatDate: (date) => {
                return new Date(date).toLocaleDateString('vi-VN');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('admin/error', { 
            message: 'Lỗi server',
            title: 'Lỗi 500'
        });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).render('admin/error', { 
                message: 'Không tìm thấy người dùng',
                title: 'Lỗi 404'
            });
        }

        // Tính toán thống kê dựa vào vai trò người dùng
        let stats = {};
        if (user.role === 'SELLER') {
            // Thống kê cho người bán
            stats = {
                totalProducts: await Product.countDocuments({ seller: user._id }),
                totalSales: await Order.countDocuments({ 
                    seller: user._id, 
                    status: 'DELIVERED' 
                }),
                rating: await Review.aggregate([
                    { $match: { seller: user._id } },
                    { $group: { 
                        _id: null, 
                        average: { $avg: '$rating' } 
                    }}
                ]).then(result => (result[0]?.average || 0).toFixed(1))
            };
        } else {
            // Thống kê cho người mua
            stats = {
                totalOrders: await Order.countDocuments({ buyer: user._id }),
                totalSpent: await Order.aggregate([
                    { $match: { 
                        buyer: user._id,
                        status: 'DELIVERED'
                    }},
                    { $group: {
                        _id: null,
                        total: { $sum: '$totalAmount' }
                    }}
                ]).then(result => result[0]?.total || 0),
                totalReviews: await Review.countDocuments({ buyer: user._id })
            };
        }

        // Lấy hoạt động gần đây
        const activities = await Activity.find({ user: user._id })
            .sort('-createdAt')
            .limit(10);

        res.render('admin/users/detail', {
            title: 'Chi tiết người dùng',
            user,
            stats,
            activities,
            formatDate: (date) => {
                return new Date(date).toLocaleDateString('vi-VN');
            },
            formatCurrency: (amount) => {
                return new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(amount);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('admin/error', { 
            message: 'Lỗi server',
            title: 'Lỗi 500'
        });
    }
};

const blockUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json({ message: 'Khóa người dùng thành công', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const unblockUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json({ message: 'Mở khóa người dùng thành công', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const createUser = async (req, res) => {
    try {
        const { email, password, fullName, phoneNumber, role, address } = req.body;

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const user = new User({
            email,
            password: hashedPassword,
            fullName,
            phoneNumber,
            role,
            address: address || '' 
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công'
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi tạo người dùng'
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { fullName, phoneNumber, address, role } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, phoneNumber, address, role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json({ message: 'Cập nhật người dùng thành công', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = {
    getUsers,
    getUser,
    blockUser,
    unblockUser,
    createUser,
    updateUser,
    deleteUser
};
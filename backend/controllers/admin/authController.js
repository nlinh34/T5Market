const User = require('../../models/User');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email, role: 'ADMIN' });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác!'
            });
        }

        req.session.userId = user._id;
        req.session.userRole = user.role;

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            redirect: '/admin/dashboard'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({
            success: false,
            message: 'Có lỗi xảy ra, vui lòng thử lại!'
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/auth/login');
    });
};
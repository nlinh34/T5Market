const User = require('../../models/User');

const loginPage = (req, res) => {
    // Kiểm tra nếu đã đăng nhập
    if (req.session && req.session.user && req.session.user.role === 'ADMIN') {
        return res.redirect('/admin');
    }
    
    // Render trang login mà không có layout
    res.render('admin/auth/login', { 
        title: 'Đăng nhập Admin', 
        layout: false,
        error: null 
    });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email và mật khẩu không được để trống' 
            });
        }

        // Tìm user với role ADMIN
        const user = await User.findOne({ 
            email: email.toLowerCase(), 
            role: 'ADMIN' 
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Email hoặc mật khẩu không đúng' 
            });
        }

        // Kiểm tra password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                success: false,
                message: 'Email hoặc mật khẩu không đúng' 
            });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (!user.isActive) {
            return res.status(400).json({ 
                success: false,
                message: 'Tài khoản đã bị khóa' 
            });
        }

        // Lưu thông tin vào session
        req.session.user = {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        };

        // Trả về success response
        res.json({ 
            success: true,
            message: 'Đăng nhập thành công', 
            redirect: '/admin' 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server: ' + error.message 
        });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/admin');
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.redirect('/admin/auth/login');
    });
};

module.exports = {
    loginPage,
    login,
    logout
};
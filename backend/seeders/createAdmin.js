const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        console.log('Đang kết nối MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Kết nối thành công!');
        
        // Kiểm tra admin đã tồn tại chưa
        const adminExists = await User.findOne({ role: 'ADMIN' });
        if (adminExists) {
            console.log('✅ Admin đã tồn tại:', adminExists.email);
            return;
        }

        // Tạo admin mới
        const admin = new User({
            email: 'admin@techmarket.com',
            password: 'admin123', // Sẽ được hash tự động
            fullName: 'Administrator',
            phoneNumber: '0123456789',
            address: 'Hà Nội, Việt Nam',
            role: 'ADMIN',
            adminLevel: 1,
            isActive: true
        });

        await admin.save();
        console.log('✅ Tạo tài khoản admin thành công!');
        console.log('📧 Email: admin@techmarket.com');
        console.log('🔑 Password: admin123');
        console.log('🌐 URL: http://localhost:3000/admin');
        
    } catch (error) {
        console.error('❌ Lỗi tạo admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Đã ngắt kết nối database');
    }
};

createAdmin();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
require('dotenv').config();

const sampleData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        await Category.deleteMany({});
        await Product.deleteMany({});

        const categories = await Category.insertMany([
            { name: 'Điện thoại', description: 'Điện thoại di động các loại' },
            { name: 'Laptop', description: 'Máy tính xách tay' },
            { name: 'Tablet', description: 'Máy tính bảng' },
            { name: 'Phụ kiện', description: 'Phụ kiện công nghệ' }
        ]);

        const seller = new User({
            email: 'seller@test.com',
            password: '123456',
            fullName: 'Người bán test',
            phoneNumber: '0987654321',
            address: 'TP.HCM',
            role: 'SELLER',
            shopName: 'TechStore',
            businessLicense: 'GP123456'
        });
        await seller.save();

        const sampleProducts = [
            {
                name: 'iPhone 12 Pro Max',
                description: 'iPhone 12 Pro Max 128GB màu xanh dương',
                price: 25000000,
                category: categories[0]._id,
                brand: 'Apple',
                condition: 'LIKE_NEW',
                images: ['iphone12.jpg'],
                seller: seller._id,
                status: 'APPROVED'
            },
            {
                name: 'MacBook Air M1',
                description: 'MacBook Air M1 2020 8GB RAM 256GB SSD',
                price: 28000000,
                category: categories[1]._id,
                brand: 'Apple',
                condition: 'GOOD',
                images: ['macbook.jpg'],
                seller: seller._id,
                status: 'APPROVED'
            }
        ];

        await Product.insertMany(sampleProducts);

        console.log('Tạo dữ liệu mẫu thành công');
    } catch (error) {
        console.error('Lỗi tạo dữ liệu mẫu:', error);
    } finally {
        await mongoose.disconnect();
    }
};

sampleData();
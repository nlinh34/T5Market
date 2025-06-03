const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    fullName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['ADMIN', 'SELLER', 'BUYER'],
        default: 'BUYER'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    shopName: {
        type: String,
        required: function() {
            return this.role === 'SELLER';
        }
    },
    businessLicense: {
        type: String,
        required: function() {
            return this.role === 'SELLER';
        }
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalSales: {
        type: Number,
        default: 0
    },
    adminLevel: {
        type: Number,
        required: function() {
            return this.role === 'ADMIN';
        }
    },
    deliveryAddress: [{
        name: String,
        phone: String,
        address: String,
        isDefault: Boolean
    }],
    paymentMethods: [{
        type: String,
        cardNumber: String,
        expiryDate: String,
        isDefault: Boolean
    }]
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
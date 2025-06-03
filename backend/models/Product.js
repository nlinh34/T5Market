const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    condition: {
        type: String,
        required: true,
        enum: ['NEW', 'LIKE_NEW', 'USED_LIKE_NEW', 'USED_GOOD', 'USED_FAIR'],
        default: 'NEW'
    },
    images: [{
        type: String,
        required: true
    }],
    status: {
        type: String,
        enum: ['DRAFT', 'PENDING', 'ACTIVE', 'REJECTED'],
        default: 'PENDING'
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    specifications: [{
        key: String,
        value: String
    }],
    weight: Number,
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    warranty: {
        duration: Number,
        unit: String
    }
}, {
    timestamps: true
});

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
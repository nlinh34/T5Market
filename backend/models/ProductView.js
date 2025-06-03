const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    viewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
    ip: String,
    userAgent: String
}, {
    timestamps: true
});

module.exports = mongoose.model('ProductView', productViewSchema);
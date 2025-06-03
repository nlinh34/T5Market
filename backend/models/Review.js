const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    images: [{
        type: String
    }],
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

reviewSchema.index({ product: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
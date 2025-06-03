const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    method: {
        type: String,
        enum: ['CREDIT_CARD', 'BANK_TRANSFER', 'E_WALLET', 'COD'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundDate: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
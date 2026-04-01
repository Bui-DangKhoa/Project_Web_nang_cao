const mongoose = require('mongoose');

const paymentLockSchema = new mongoose.Schema({
    provider: { type: String, required: true, index: true },
    transactionNo: { type: String, required: true, unique: true },
    orderId: { type: String, index: true },
    source: { type: String, enum: ['return', 'ipn'], required: true },
    state: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    attempts: { type: Number, default: 1 },
    lastMessage: String,
    finishedAt: Date,
}, { timestamps: true });

paymentLockSchema.index({ transactionNo: 1 }, { unique: true });

module.exports = mongoose.model('PaymentLock', paymentLockSchema);

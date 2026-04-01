const mongoose = require('mongoose');

const paymentAuditSchema = new mongoose.Schema({
    provider: { type: String, required: true, index: true },
    channel: { type: String, required: true, enum: ['create', 'return', 'ipn'] },
    orderId: { type: String, index: true },
    transactionNo: { type: String, index: true },
    txnRef: { type: String, index: true },
    clientIp: String,
    signatureValid: Boolean,
    responseCode: String,
    amount: Number,
    processingStatus: {
        type: String,
        enum: ['received', 'rejected', 'processing', 'success', 'failed', 'duplicate'],
        default: 'received',
    },
    message: String,
    payload: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('PaymentAudit', paymentAuditSchema);

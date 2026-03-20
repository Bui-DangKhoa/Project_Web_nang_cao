const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true }, // % hoặc số tiền giảm trực tiếp
    minOrder: { type: Number, default: 0 },  // đơn tối thiểu để áp dụng
    maxDiscount: { type: Number },           // mức giảm tối đa (cho mã %)
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    usageLimit: { type: Number },            // tổng số lần được dùng
    usedCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);


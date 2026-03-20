const Coupon = require('../models/Coupon');

const calculateDiscount = (orderTotal, coupon) => {
    if (!coupon || !coupon.isActive) return 0;
    let discount = 0;

    if (coupon.type === 'percent') {
        discount = Math.round((orderTotal * coupon.value) / 100);
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
        }
    } else if (coupon.type === 'fixed') {
        discount = coupon.value;
    }

    if (discount < 0) discount = 0;
    if (discount > orderTotal) discount = orderTotal;

    return discount;
};

const validateCoupon = async ({ code, orderTotal }) => {
    if (!code) {
        return { valid: false, reason: 'Vui lòng nhập mã giảm giá' };
    }
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon || !coupon.isActive) {
        return { valid: false, reason: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' };
    }

    // Nếu có ngày hết hạn thì kiểm tra, còn không thì bỏ qua
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return { valid: false, reason: 'Mã giảm giá đã hết hạn' };
    }

    // Nếu có giới hạn số lần dùng thì kiểm tra, còn không thì bỏ qua
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, reason: 'Mã giảm giá đã đạt số lần sử dụng tối đa' };
    }

    const discount = calculateDiscount(orderTotal, coupon);
    const finalTotal = orderTotal - discount;

    if (discount <= 0) {
        return { valid: false, reason: 'Mã giảm giá không áp dụng cho đơn này' };
    }

    return {
        valid: true,
        coupon,
        discount,
        finalTotal,
        reason: 'Áp dụng mã giảm giá thành công',
    };
};

module.exports = {
    calculateDiscount,
    validateCoupon,
};


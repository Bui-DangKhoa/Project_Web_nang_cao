const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    orderItems: [{
        name: String,
        qty: Number,
        image: String,
        price: Number,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        color: String,
        size: String,
    }],
    shippingAddress: {
        name: String,
        street: String,
        city: String,
        district: String,
        phone: String,
    },
    paymentMethod: String,
    paymentResult: {
        id: String,
        provider: String,
        method: String,
        status: String,
        amount: Number,
        currency: String,
        transactionNo: String,
        payUrl: String,
        bankCode: String,
        payDate: String,
        update_time: String,
    },
    itemsPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, trim: true, uppercase: true },
    totalPrice: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    status: {
        type: String,
        enum: ['Chờ xác nhận', 'Đang xử lý', 'Đang vận chuyển', 'Đã giao', 'Đã hủy'],
        default: 'Chờ xác nhận',
    },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

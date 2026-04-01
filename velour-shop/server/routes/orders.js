const crypto = require('crypto');
const router = require('express').Router();
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const PaymentAudit = require('../models/PaymentAudit');
const PaymentLock = require('../models/PaymentLock');
const { protect } = require('../middleware/auth');
const { validateCoupon } = require('../utils/coupon');

const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const formatVnpDate = (date = new Date()) => {
    const tzOffsetMs = 7 * 60 * 60 * 1000;
    const local = new Date(date.getTime() + tzOffsetMs);
    const y = local.getUTCFullYear();
    const m = String(local.getUTCMonth() + 1).padStart(2, '0');
    const d = String(local.getUTCDate()).padStart(2, '0');
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const mm = String(local.getUTCMinutes()).padStart(2, '0');
    const ss = String(local.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}${hh}${mm}${ss}`;
};

const buildVnpSignData = (params = {}) => {
    const sortedKeys = Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
        .sort();
    return sortedKeys
        .map((k) => `${k}=${encodeURIComponent(String(params[k])).replace(/%20/g, '+')}`)
        .join('&');
};

const buildVnpSignedUrl = (baseUrl, params, secret) => {
    const signData = buildVnpSignData(params);
    const secureHash = crypto
        .createHmac('sha512', secret)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');
    return `${baseUrl}?${signData}&vnp_SecureHash=${secureHash}`;
};

const verifyVnpSignature = (query, secret) => {
    const copied = { ...query };
    const receivedHash = copied.vnp_SecureHash;
    delete copied.vnp_SecureHash;
    delete copied.vnp_SecureHashType;

    if (!receivedHash || !secret) return false;

    const signData = buildVnpSignData(copied);
    const expectedHash = crypto
        .createHmac('sha512', secret)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');
    return String(receivedHash).toLowerCase() === expectedHash.toLowerCase();
};

const settleVnpayOrder = async ({
    orderId,
    responseCode,
    amount,
    transactionNo,
    bankCode,
    payDate,
    payUrl,
}) => {
    const order = await Order.findById(orderId);
    if (!order) return { ok: false, reason: 'order_not_found' };

    const normalizedAmount = Math.max(0, toNumber(amount));
    const expectedAmount = Math.round(Math.max(0, toNumber(order.totalPrice)) * 100);

    if (responseCode !== '00') {
        if (!order.isPaid) {
            order.paymentResult = {
                ...(order.paymentResult || {}),
                provider: 'vnpay',
                method: 'vnpay',
                status: 'failed',
                amount: order.totalPrice,
                currency: 'VND',
                transactionNo: transactionNo ? String(transactionNo) : order.paymentResult?.transactionNo,
                payUrl: payUrl || order.paymentResult?.payUrl,
                update_time: new Date().toISOString(),
            };
            await order.save();
        }
        return { ok: false, reason: 'payment_failed', order };
    }

    if (normalizedAmount !== expectedAmount) {
        return { ok: false, reason: 'invalid_amount', order };
    }

    if (order.isPaid) {
        return { ok: true, reason: 'already_paid', order };
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
        ...(order.paymentResult || {}),
        id: order.paymentResult?.id || String(orderId),
        provider: 'vnpay',
        method: 'vnpay',
        status: 'paid',
        amount: order.totalPrice,
        currency: 'VND',
        transactionNo: transactionNo ? String(transactionNo) : String(orderId),
        payUrl: payUrl || order.paymentResult?.payUrl,
        update_time: new Date().toISOString(),
        bankCode: bankCode ? String(bankCode) : undefined,
        payDate: payDate ? String(payDate) : undefined,
    };
    await order.save();

    return { ok: true, reason: 'paid', order };
};

const calculateItemsPrice = (orderItems = []) => orderItems.reduce(
    (sum, item) => sum + toNumber(item.price) * Math.max(1, toNumber(item.qty)),
    0,
);

const normalizePaymentResult = (paymentResult) => {
    if (!paymentResult || typeof paymentResult !== 'object') return undefined;
    return {
        id: paymentResult.id ? String(paymentResult.id) : undefined,
        provider: paymentResult.provider ? String(paymentResult.provider) : undefined,
        method: paymentResult.method ? String(paymentResult.method) : undefined,
        status: paymentResult.status ? String(paymentResult.status) : undefined,
        amount: toNumber(paymentResult.amount),
        currency: paymentResult.currency ? String(paymentResult.currency) : undefined,
        transactionNo: paymentResult.transactionNo ? String(paymentResult.transactionNo) : undefined,
        payUrl: paymentResult.payUrl ? String(paymentResult.payUrl) : undefined,
        bankCode: paymentResult.bankCode ? String(paymentResult.bankCode) : undefined,
        payDate: paymentResult.payDate ? String(paymentResult.payDate) : undefined,
        update_time: paymentResult.update_time ? String(paymentResult.update_time) : new Date().toISOString(),
    };
};

const appendQueryParam = (url, key, value) => {
    if (!url || !value) return url;
    const hasQuery = url.includes('?');
    return `${url}${hasQuery ? '&' : '?'}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
};

const getClientIp = (req) => {
    const fromHeader = req.headers['x-forwarded-for']?.split(',')[0]?.trim();
    const raw = fromHeader || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
    return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
};

const getIpAllowlist = () => {
    const raw = process.env.VNPAY_IPN_ALLOWLIST || '';
    return raw
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
};

const isIpAllowed = (ip) => {
    const allowlist = getIpAllowlist();
    if (allowlist.includes('*')) return true;

    if (allowlist.length === 0) {
        return process.env.NODE_ENV !== 'production';
    }

    return allowlist.includes(ip);
};

const writeAudit = async ({
    channel,
    req,
    signatureValid,
    processingStatus,
    message,
}) => {
    const payload = { ...(req.query || {}) };
    const amountRaw = payload.vnp_Amount;
    const amount = amountRaw ? toNumber(amountRaw) / 100 : undefined;

    return PaymentAudit.create({
        provider: 'vnpay',
        channel,
        orderId: payload.vnp_TxnRef ? String(payload.vnp_TxnRef) : undefined,
        transactionNo: payload.vnp_TransactionNo ? String(payload.vnp_TransactionNo) : undefined,
        txnRef: payload.vnp_TxnRef ? String(payload.vnp_TxnRef) : undefined,
        clientIp: getClientIp(req),
        signatureValid,
        responseCode: payload.vnp_ResponseCode ? String(payload.vnp_ResponseCode) : undefined,
        amount,
        processingStatus,
        message,
        payload,
    });
};

const finalizeAudit = async (auditId, patch = {}) => {
    if (!auditId) return;
    await PaymentAudit.updateOne({ _id: auditId }, { $set: patch });
};

const acquireTransactionLock = async ({ transactionNo, orderId, source }) => {
    if (!transactionNo) {
        return { ok: false, reason: 'missing_transaction' };
    }

    try {
        await PaymentLock.create({
            provider: 'vnpay',
            transactionNo,
            orderId,
            source,
            state: 'processing',
            attempts: 1,
        });
        return { ok: true };
    } catch (err) {
        if (err.code !== 11000) throw err;

        const existing = await PaymentLock.findOne({ transactionNo });
        if (!existing) return { ok: false, reason: 'lock_conflict' };

        if (existing.state === 'completed') {
            return { ok: false, reason: 'already_completed', lock: existing };
        }

        const lockTimeoutMs = Math.max(5000, toNumber(process.env.VNPAY_LOCK_TIMEOUT_MS) || 120000);
        const staleBefore = new Date(Date.now() - lockTimeoutMs);

        const takeover = await PaymentLock.findOneAndUpdate(
            {
                transactionNo,
                state: 'processing',
                updatedAt: { $lt: staleBefore },
            },
            {
                $set: {
                    source,
                    orderId,
                    lastMessage: 'stale lock takeover',
                },
                $inc: { attempts: 1 },
            },
            { new: true },
        );

        if (takeover) return { ok: true, reason: 'stale_takeover' };

        return { ok: false, reason: 'in_progress', lock: existing };
    }
};

const releaseTransactionLock = async ({ transactionNo, success, message }) => {
    if (!transactionNo) return;
    await PaymentLock.updateOne(
        { transactionNo },
        {
            $set: {
                state: success ? 'completed' : 'failed',
                lastMessage: message,
                finishedAt: new Date(),
            },
        },
    );
};

// POST /api/orders
router.post('/', protect, async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        paymentResult,
        couponCode,
    } = req.body;

    if (!orderItems?.length) return res.status(400).json({ message: 'Không có sản phẩm' });

    const itemsPrice = calculateItemsPrice(orderItems);
    const shippingPrice = 0;
    let discountAmount = 0;
    let normalizedCouponCode;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
        const couponCheck = await validateCoupon({ code: couponCode, orderTotal: itemsPrice });
        if (!couponCheck.valid) {
            return res.status(400).json({ message: couponCheck.reason });
        }
        discountAmount = toNumber(couponCheck.discount);
        normalizedCouponCode = couponCheck.coupon.code;
    }

    const totalPrice = Math.max(0, itemsPrice + shippingPrice - discountAmount);
    const normalizedPayment = normalizePaymentResult(paymentResult);
    const normalizedMethod = (paymentMethod || 'cod').toLowerCase();

    const order = await Order.create({
        user: req.user._id,
        orderItems,
        shippingAddress,
        itemsPrice,
        shippingPrice,
        discountAmount,
        totalPrice,
        couponCode: normalizedCouponCode,
        paymentMethod: normalizedMethod,
        paymentResult: normalizedPayment,
        isPaid: normalizedMethod === 'cod' ? false : normalizedPayment?.status === 'paid',
        paidAt: normalizedPayment?.status === 'paid' ? new Date() : undefined,
    });

    if (normalizedCouponCode) {
        await Coupon.updateOne({ code: normalizedCouponCode }, { $inc: { usedCount: 1 } });
    }

    res.status(201).json(order);
});

// POST /api/orders/payment/momo/create
router.post('/payment/momo/create', protect, async (req, res) => {
    const amount = Math.max(0, toNumber(req.body.amount));
    const requestId = `MM-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const orderId = req.body.orderId || `order-${Date.now()}`;
    const payUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:5173'}/dashboard?payment=momo_pending&orderId=${orderId}`;

    return res.json({
        partnerCode: process.env.MOMO_PARTNER_CODE || 'VELOUR_SANDBOX',
        orderId,
        requestId,
        amount,
        payUrl,
    });
});

// POST /api/orders/payment/vnpay/create
router.post('/payment/vnpay/create', protect, async (req, res) => {
    const amountVnd = Math.max(0, toNumber(req.body.amount));
    const orderId = req.body.orderId ? String(req.body.orderId) : undefined;
    if (!orderId) return res.status(400).json({ message: 'Thiếu orderId' });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/orders/payment/vnpay/return';
    const ipnUrl = process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/orders/payment/vnpay/ipn';

    if (!tmnCode || !hashSecret) {
        return res.status(500).json({ message: 'Thiếu cấu hình VNPay (VNPAY_TMN_CODE/VNPAY_HASH_SECRET)' });
    }

    const amountToPay = Math.round(Math.max(0, amountVnd || order.totalPrice) * 100);
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.connection?.remoteAddress
        || req.socket?.remoteAddress
        || '127.0.0.1';

    const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Amount: amountToPay,
        vnp_ReturnUrl: returnUrl,
        vnp_IpnUrl: ipnUrl,
        vnp_IpAddr: clientIp,
        vnp_CreateDate: formatVnpDate(),
    };

    const payUrl = buildVnpSignedUrl(vnpUrl, vnpParams, hashSecret);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(payUrl)}`;

    await PaymentAudit.create({
        provider: 'vnpay',
        channel: 'create',
        orderId,
        txnRef: orderId,
        clientIp,
        signatureValid: true,
        responseCode: '00',
        amount: amountVnd,
        processingStatus: 'success',
        message: 'Generated VNPay payment URL',
        payload: vnpParams,
    });

    order.paymentMethod = 'vnpay';
    order.paymentResult = {
        ...(order.paymentResult || {}),
        id: order.paymentResult?.id || orderId,
        provider: 'vnpay',
        method: 'vnpay',
        status: order.isPaid ? 'paid' : 'pending',
        amount: order.totalPrice,
        currency: 'VND',
        transactionNo: order.paymentResult?.transactionNo,
        payUrl,
        update_time: new Date().toISOString(),
    };
    await order.save();

    return res.json({
        tmnCode,
        orderId,
        txnRef: orderId,
        amount: amountVnd,
        payUrl,
        qrUrl,
    });
});

// GET /api/orders/payment/vnpay/return
router.get('/payment/vnpay/return', async (req, res) => {
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
    const isValid = verifyVnpSignature(req.query, hashSecret);

    const returnAudit = await writeAudit({
        channel: 'return',
        req,
        signatureValid: isValid,
        processingStatus: 'received',
        message: 'VNPay return callback received',
    });

    const orderId = req.query.vnp_TxnRef ? String(req.query.vnp_TxnRef) : '';
    if (!isValid || !orderId) {
        await finalizeAudit(returnAudit?._id, {
            processingStatus: 'rejected',
            message: !isValid ? 'Invalid checksum on return callback' : 'Missing order reference',
        });
        return res.redirect(`${appUrl}/dashboard?payment=vnpay_error`);
    }

    const transactionNo = req.query.vnp_TransactionNo ? String(req.query.vnp_TransactionNo) : `return-${orderId}`;
    const lock = await acquireTransactionLock({ transactionNo, orderId, source: 'return' });
    if (!lock.ok) {
        await finalizeAudit(returnAudit?._id, {
            processingStatus: lock.reason === 'already_completed' ? 'duplicate' : 'processing',
            message: `Return lock skipped: ${lock.reason}`,
        });
        const paymentState = lock.reason === 'already_completed' ? 'vnpay_success' : 'vnpay_pending';
        return res.redirect(`${appUrl}/dashboard?payment=${paymentState}&orderId=${encodeURIComponent(orderId)}`);
    }

    try {
        const result = await settleVnpayOrder({
            orderId,
            responseCode: String(req.query.vnp_ResponseCode || ''),
            amount: req.query.vnp_Amount,
            transactionNo: req.query.vnp_TransactionNo,
            bankCode: req.query.vnp_BankCode,
            payDate: req.query.vnp_PayDate,
            payUrl: undefined,
        });

        await releaseTransactionLock({
            transactionNo,
            success: result.ok,
            message: result.reason,
        });

        await finalizeAudit(returnAudit?._id, {
            processingStatus: result.ok ? 'success' : 'failed',
            message: `Return processed: ${result.reason}`,
        });

        if (result.reason === 'invalid_amount') {
            return res.redirect(`${appUrl}/dashboard?payment=vnpay_error&orderId=${encodeURIComponent(orderId)}`);
        }

        if (result.ok) {
            return res.redirect(`${appUrl}/dashboard?payment=vnpay_success&orderId=${encodeURIComponent(orderId)}`);
        }

        return res.redirect(`${appUrl}/dashboard?payment=vnpay_cancel&orderId=${encodeURIComponent(orderId)}`);
    } catch (err) {
        await releaseTransactionLock({
            transactionNo,
            success: false,
            message: `return_exception:${err.message}`,
        });
        await finalizeAudit(returnAudit?._id, {
            processingStatus: 'failed',
            message: `Return exception: ${err.message}`,
        });
        return res.redirect(`${appUrl}/dashboard?payment=vnpay_error&orderId=${encodeURIComponent(orderId)}`);
    }
});

// GET /api/orders/payment/vnpay/ipn
router.get('/payment/vnpay/ipn', async (req, res) => {
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    const isValid = verifyVnpSignature(req.query, hashSecret);
    const clientIp = getClientIp(req);

    const ipnAudit = await writeAudit({
        channel: 'ipn',
        req,
        signatureValid: isValid,
        processingStatus: 'received',
        message: 'VNPay IPN callback received',
    });

    if (!isIpAllowed(clientIp)) {
        await finalizeAudit(ipnAudit?._id, {
            processingStatus: 'rejected',
            message: `IP ${clientIp} not in VNPAY_IPN_ALLOWLIST`,
        });
        return res.json({ RspCode: '97', Message: 'IP not allowed' });
    }

    if (!isValid) {
        await finalizeAudit(ipnAudit?._id, {
            processingStatus: 'rejected',
            message: 'Invalid checksum on IPN callback',
        });
        return res.json({ RspCode: '97', Message: 'Invalid checksum' });
    }

    const orderId = req.query.vnp_TxnRef ? String(req.query.vnp_TxnRef) : '';
    if (!orderId) {
        await finalizeAudit(ipnAudit?._id, {
            processingStatus: 'failed',
            message: 'Missing order reference in IPN',
        });
        return res.json({ RspCode: '01', Message: 'Order not found' });
    }

    const transactionNo = req.query.vnp_TransactionNo ? String(req.query.vnp_TransactionNo) : `ipn-${orderId}`;
    const lock = await acquireTransactionLock({ transactionNo, orderId, source: 'ipn' });
    if (!lock.ok) {
        const processingStatus = lock.reason === 'already_completed' ? 'duplicate' : 'processing';
        await finalizeAudit(ipnAudit?._id, {
            processingStatus,
            message: `IPN lock skipped: ${lock.reason}`,
        });
        if (lock.reason === 'already_completed') {
            return res.json({ RspCode: '02', Message: 'Order already confirmed' });
        }
        return res.json({ RspCode: '00', Message: 'Processing' });
    }

    try {
        const result = await settleVnpayOrder({
            orderId,
            responseCode: String(req.query.vnp_ResponseCode || ''),
            amount: req.query.vnp_Amount,
            transactionNo: req.query.vnp_TransactionNo,
            bankCode: req.query.vnp_BankCode,
            payDate: req.query.vnp_PayDate,
            payUrl: undefined,
        });

        await releaseTransactionLock({
            transactionNo,
            success: result.ok,
            message: result.reason,
        });

        await finalizeAudit(ipnAudit?._id, {
            processingStatus: result.ok ? 'success' : (result.reason === 'already_paid' ? 'duplicate' : 'failed'),
            message: `IPN processed: ${result.reason}`,
        });

        if (result.reason === 'order_not_found') {
            return res.json({ RspCode: '01', Message: 'Order not found' });
        }
        if (result.reason === 'invalid_amount') {
            return res.json({ RspCode: '04', Message: 'Invalid amount' });
        }
        if (result.reason === 'already_paid') {
            return res.json({ RspCode: '02', Message: 'Order already confirmed' });
        }
        if (!result.ok) {
            return res.json({ RspCode: '00', Message: 'Payment failed state recorded' });
        }

        return res.json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (err) {
        await releaseTransactionLock({
            transactionNo,
            success: false,
            message: `ipn_exception:${err.message}`,
        });
        await finalizeAudit(ipnAudit?._id, {
            processingStatus: 'failed',
            message: `IPN exception: ${err.message}`,
        });
        return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
});

// POST /api/orders/payment/stripe/checkout-session
router.post('/payment/stripe/checkout-session', protect, async (req, res) => {
    const sessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
    const fallbackSuccess = `${process.env.PUBLIC_APP_URL || 'http://localhost:5173'}/dashboard?payment=stripe_success`;
    const orderId = req.body.orderId ? String(req.body.orderId) : undefined;
    const successUrl = appendQueryParam(req.body.successUrl || fallbackSuccess, 'orderId', orderId);

    return res.json({
        sessionId,
        url: successUrl,
        amount: Math.max(0, toNumber(req.body.amount)),
    });
});

// POST /api/orders/payment/paypal/create-order
router.post('/payment/paypal/create-order', protect, async (req, res) => {
    const orderId = `PAYPAL-${crypto.randomBytes(10).toString('hex')}`;
    const approveLink = `${process.env.PUBLIC_APP_URL || 'http://localhost:5173'}/dashboard?payment=paypal_pending&orderId=${orderId}`;

    return res.json({
        orderId,
        amount: toNumber(req.body.amount),
        currency: req.body.currency || 'USD',
        links: [{ rel: 'approve', href: approveLink }],
    });
});

// POST /api/orders/payment/paypal/capture
router.post('/payment/paypal/capture', protect, async (req, res) => {
    const captureId = `CAP-${crypto.randomBytes(10).toString('hex')}`;
    return res.json({
        status: 'COMPLETED',
        captureId,
        orderId: req.body.orderId,
        update_time: new Date().toISOString(),
    });
});

// GET /api/orders/myorders (must be before /:id)
router.get('/myorders', protect, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json(orders);
});

// POST /api/orders/:id/payment/demo-confirm (must be before generic /:id)
router.post('/:id/payment/demo-confirm', protect, async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user._id;

        console.log(`[demo-confirm] Checking order: ${orderId} for user: ${userId}`);

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            console.log(`[demo-confirm] Order not found or user mismatch`);
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc không có quyền' });
        }

        const provider = String(req.body.provider || order.paymentResult?.provider || order.paymentMethod || 'demo');
        const transactionNo = req.body.transactionNo ? String(req.body.transactionNo) : `${provider.toUpperCase()}-${Date.now()}`;

        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
            ...(order.paymentResult || {}),
            id: order.paymentResult?.id || transactionNo,
            provider,
            method: order.paymentResult?.method || order.paymentMethod,
            status: 'paid',
            amount: order.totalPrice,
            currency: order.paymentResult?.currency || 'VND',
            transactionNo,
            update_time: new Date().toISOString(),
        };

        await order.save();
        console.log(`[demo-confirm] Order ${orderId} saved with isPaid=true`);
        return res.json({ message: 'Đã xác nhận thanh toán demo', order });
    } catch (err) {
        console.error(`[demo-confirm] Error:`, err.message);
        return res.status(500).json({ message: err.message || 'Lỗi xác nhận thanh toán' });
    }
});

// GET /api/orders/:id (generic, must be last)
router.get('/:id', protect, async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email username');
    if (order) res.json(order);
    else res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
});

module.exports = router;

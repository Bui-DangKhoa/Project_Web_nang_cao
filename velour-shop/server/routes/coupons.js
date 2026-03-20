const router = require('express').Router();
const { validateCoupon } = require('../utils/coupon');

// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
    try {
        const { code, orderTotal } = req.body;
        const total = Number(orderTotal) || 0;
        const result = await validateCoupon({ code, orderTotal: total });

        if (!result.valid) {
            return res.status(400).json({ message: result.reason });
        }

        return res.json({
            code: result.coupon.code,
            discount: result.discount,
            finalTotal: result.finalTotal,
            message: result.reason,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Không thể kiểm tra mã giảm giá', error: err.message });
    }
});

module.exports = router;


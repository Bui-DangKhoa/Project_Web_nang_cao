const jwt = require('jsonwebtoken');
const { Customer } = require('../models/Models');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const customer = await Customer.findById(decoded.id).select('-password');
            if (!customer) {
                return res.status(401).json({ message: 'Không tìm thấy tài khoản' });
            }
            req.user = customer;
            req.customer = customer;
            next();
        } catch {
            res.status(401).json({ message: 'Token không hợp lệ' });
        }
    }
    if (!token) res.status(401).json({ message: 'Chưa đăng nhập' });
};

module.exports = { protect };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch {
            res.status(401).json({ message: 'Token không hợp lệ' });
        }
    }
    if (!token) res.status(401).json({ message: 'Chưa đăng nhập' });
};

module.exports = { protect };

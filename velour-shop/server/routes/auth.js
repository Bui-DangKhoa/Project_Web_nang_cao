const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Customer } = require('../models/Models');
const Address = require('../models/Address');
const CryptoUtil = require('../utils/CryptoUtil');
const EmailUtil = require('../utils/EmailUtil');
const { verifyFirebaseIdToken } = require('../config/firebaseAdmin');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const buildAuthResponse = (customer) => ({
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    role: 'user',
    token: generateToken(customer._id),
});

const matchCustomerPassword = async (enteredPassword, storedPassword = '') => {
    if (!enteredPassword || !storedPassword) return false;
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
        return bcrypt.compare(enteredPassword, storedPassword);
    }
    if (enteredPassword === storedPassword) return true;
    return CryptoUtil.md5(enteredPassword) === storedPassword;
};

const ensureUniqueUsername = async (seed) => {
    const cleanSeed = (seed || 'customer').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'customer';
    let username = cleanSeed;
    let count = 0;

    while (await Customer.findOne({ username })) {
        count += 1;
        username = `${cleanSeed}_${count}`;
    }

    return username;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedPhone = (phone || '').trim();

        if (!name || !normalizedEmail || !password || !normalizedPhone) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin đăng ký' });
        }

        const existingCustomer = await Customer.findOne({ email: normalizedEmail });
        if (existingCustomer) {
            return res.status(400).json({
                message: existingCustomer.active !== 1
                    ? 'Email đã đăng ký nhưng chưa kích hoạt. Vui lòng kiểm tra email để active tài khoản.'
                    : 'Email đã tồn tại',
            });
        }

        const activationToken = CryptoUtil.md5(`${Date.now()}-${normalizedEmail}`);
        const username = await ensureUniqueUsername(normalizedEmail.split('@')[0]);
        const hashedPassword = await bcrypt.hash(password, 12);

        const customer = await Customer.create({
            _id: new mongoose.Types.ObjectId(),
            username,
            name,
            phone: normalizedPhone,
            email: normalizedEmail,
            password: hashedPassword,
            active: 0,
            token: activationToken,
        });

        await Address.create({
            user: customer._id,
            label: 'Mặc định',
            name,
            street: '',
            city: 'Hồ Chí Minh',
            district: '',
            phone: normalizedPhone,
            isDefault: true,
        });

        await EmailUtil.send(normalizedEmail, customer._id, activationToken);

        return res.status(201).json({
            message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy id/token và kích hoạt tài khoản trước khi đăng nhập.',
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || 'Đăng ký thất bại. Vui lòng thử lại sau.',
        });
    }
});

// POST /api/auth/activate
router.post('/activate', async (req, res) => {
    try {
        const { id, token } = req.body;

        if (!id || !token) {
            return res.status(400).json({ message: 'Thiếu id hoặc token để kích hoạt tài khoản' });
        }

        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }

        if (customer.active === 1) {
            return res.json({ message: 'Tài khoản đã được kích hoạt trước đó. Bạn có thể đăng nhập.' });
        }

        if (customer.token !== token) {
            return res.status(400).json({ message: 'Thông tin kích hoạt không hợp lệ' });
        }

        customer.active = 1;
        customer.token = '';
        await customer.save();

        return res.json({ message: 'Kích hoạt tài khoản thành công. Bây giờ bạn có thể đăng nhập.' });
    } catch (err) {
        return res.status(500).json({ message: err.message || 'Kích hoạt thất bại' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const identifierRaw = (email || username || '').trim();
        const identifier = identifierRaw.toLowerCase();

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email/username và mật khẩu' });
        }

        const customer = await Customer.findOne({
            $or: [{ username: identifierRaw }, { email: identifier }],
        }).exec();

        if (!customer || !(await matchCustomerPassword(password, customer.password))) {
            return res.status(401).json({ message: 'Email/username hoặc mật khẩu không đúng' });
        }

        if (customer.active !== 1) {
            return res.status(403).json({
                message: 'Tài khoản chưa được kích hoạt. Vui lòng active qua email trước khi đăng nhập.',
            });
        }

        if (!(customer.password || '').startsWith('$2')) {
            customer.password = await bcrypt.hash(password, 12);
            await customer.save();
        }

        return res.json(buildAuthResponse(customer));
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/oauth/firebase
router.post('/oauth/firebase', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'Thiếu idToken.' });
        }

        const decoded = await verifyFirebaseIdToken(idToken);
        const provider = decoded.firebase?.sign_in_provider;

        if (!decoded.email) {
            return res.status(400).json({
                message: 'Tài khoản social chưa có email. Vui lòng thử tài khoản khác.',
            });
        }

        // Only allow OAuth providers that are expected by the client login UI.
        if (provider && !['google.com', 'facebook.com', 'google', 'facebook'].includes(provider)) {
            return res.status(400).json({
                message: 'Provider social chưa được hỗ trợ.',
            });
        }

        const normalizedEmail = decoded.email.toLowerCase();
        let customer = await Customer.findOne({ email: normalizedEmail });
        if (!customer) {
            const username = await ensureUniqueUsername(normalizedEmail.split('@')[0]);
            const randomPassword = crypto.randomBytes(24).toString('hex');
            customer = await Customer.create({
                _id: new mongoose.Types.ObjectId(),
                username,
                name: decoded.name || normalizedEmail.split('@')[0],
                phone: '',
                email: normalizedEmail,
                password: await bcrypt.hash(randomPassword, 12),
                active: 1,
                token: '',
            });
        } else if (customer.active !== 1) {
            customer.active = 1;
            customer.token = '';
            await customer.save();
        }

        return res.json(buildAuthResponse(customer));
    } catch (err) {
        return res.status(401).json({
            message: err.message || 'Không thể xác thực tài khoản social.',
        });
    }
});

module.exports = router;

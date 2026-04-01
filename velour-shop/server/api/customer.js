const express = require('express');
const router = express.Router();

// utils
const CryptoUtil = require('../utils/CryptoUtil');
const EmailUtil = require('../utils/EmailUtil');
const JwtUtil = require('../utils/JwtUtil');

// daos
const CustomerDAO = require('../models/CustomerDAO');
const OrderDAO = require('../models/OrderDAO');

// customer
router.post('/signup', async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;
  const dbCust = await CustomerDAO.selectByUsernameOrEmail(username, email);

  if (dbCust) {
    res.json({ success: false, message: 'Exists username or email' });
  } else {
    const now = new Date().getTime();
    const token = CryptoUtil.md5(now.toString());
    const newCust = {
      username: username,
      password: password,
      name: name,
      phone: phone,
      email: email,
      active: 0,
      token: token,
    };
    const result = await CustomerDAO.insert(newCust);
    if (result) {
      try {
        const send = await EmailUtil.send(email, result._id, token);
        if (send) {
          res.json({
            success: true,
            message: 'Please check email to activate your account',
          });
        } else {
          res.json({
            success: false,
            message: 'Failed to send activation email. Please try again later.',
          });
        }
      } catch (err) {
        console.error('Signup email error:', err.message);
        res.json({
          success: false,
          message: 'Failed to send activation email. Please try again later.',
        });
      }
    } else {
      res.json({ success: false, message: 'Insert failure' });
    }
  }
});

router.post('/active', async function (req, res) {
  const _id = req.body.id;
  const token = req.body.token;
  const result = await CustomerDAO.active(_id, token, 1);
  res.json(result);
});

router.post('/login', async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password) {
    const customer = await CustomerDAO.selectByUsernameAndPassword(username, password);
    if (customer) {
      if (customer.active === 1) {
        const token = JwtUtil.genToken();
        res.json({ success: true, message: 'Authentication successful', token: token, customer: customer });
      } else {
        res.json({ success: false, message: 'Account is deactive' });
      }
    } else {
      res.json({ success: false, message: 'Incorrect username or password' });
    }
  } else {
    res.json({ success: false, message: 'Please input username and password' });
  }
});

router.post('/login-google', async function (req, res) {
  const email = req.body.email;
  const name = req.body.name || '';

  if (!email) {
    return res.json({ success: false, message: 'Google account email is required' });
  }

  try {
    let customer = await CustomerDAO.selectByEmail(email);

    if (!customer) {
      const usernameBase = email.split('@')[0] || 'google_user';
      let candidateUsername = usernameBase + '_gg';
      let duplicated = await CustomerDAO.selectByUsernameOrEmail(candidateUsername, email);
      while (duplicated) {
        candidateUsername = `${usernameBase}_gg_${Math.floor(Math.random() * 100000)}`;
        duplicated = await CustomerDAO.selectByUsernameOrEmail(candidateUsername, email);
      }
      const tokenSeed = new Date().getTime().toString() + email;
      const newCust = {
        username: candidateUsername,
        password: CryptoUtil.md5(email),
        name: name || usernameBase,
        phone: '',
        email: email,
        active: 1,
        token: CryptoUtil.md5(tokenSeed),
      };
      customer = await CustomerDAO.insert(newCust);
    } else if (customer.active !== 1) {
      customer = await CustomerDAO.active(customer._id, customer.token, 1);
    }

    const token = JwtUtil.genToken(customer.username, customer.password);
    return res.json({
      success: true,
      message: 'Authentication successful',
      token: token,
      customer: customer,
    });
  } catch (err) {
    return res.json({ success: false, message: 'Google login failure' });
  }
});

router.get('/token', JwtUtil.checkToken, function (req, res) {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  res.json({ success: true, message: 'Token is valid', token: token });
});

// myprofile
router.put('/customers/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const username = req.body.username;
  const password = req.body.password;
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;

  const customer = {
    _id: _id,
    username: username,
    password: password,
    name: name,
    phone: phone,
    email: email,
  };

  const result = await CustomerDAO.update(customer);
  res.json(result);
});

router.post('/checkout', JwtUtil.checkToken, async function (req, res) {
  const now = new Date().getTime();
  const total = req.body.total;
  const items = req.body.items;
  const customer = req.body.customer;
  const order = { cdate: now, total: total, status: 'PENDING', customer: customer, items: items };
  const result = await OrderDAO.insert(order);
  res.json(result);
});

router.get('/orders/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  const _cid = req.params.cid;
  const orders = await OrderDAO.selectByCustID(_cid);
  res.json(orders);
});

module.exports = router;

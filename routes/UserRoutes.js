

const express = require('express');
const { register, login, verifyToken } = require('../Controllers/UserController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyToken, (req, res) => {
  res.json({ message: 'Token is valid' });
});

module.exports = router;

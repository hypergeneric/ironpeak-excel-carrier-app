const express = require('express');
const { login, forgotPassword, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
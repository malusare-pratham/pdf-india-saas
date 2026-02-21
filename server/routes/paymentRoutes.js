const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { toolLimiter } = require('../middleware/rateLimiter');

router.post('/create-order', protect, toolLimiter, createOrder);
router.post('/verify', protect, toolLimiter, verifyPayment);

module.exports = router;


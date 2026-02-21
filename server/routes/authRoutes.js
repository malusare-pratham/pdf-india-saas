const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getProfile 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/auth/register
 * @desc    नवीन युजरची नोंदणी करणे (Register)
 * @access  Public
 */
router.post('/register', authLimiter, register);

/**
 * @route   POST /api/auth/login
 * @desc    युजर लॉगिन करणे (Login)
 * @access  Public
 */
router.post('/login', authLimiter, login);

/**
 * @route   GET /api/auth/profile
 * @desc    युजरची माहिती मिळवणे (Profile)
 * @access  Private (JWT Token Required)
 */
router.get('/profile', protect, getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    युजर लॉगआउट (Frontend वरून टोकन रिमूव्ह करणे हीच बेस्ट प्रॅक्टिस आहे)
 */
router.post('/logout', (req, res) => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

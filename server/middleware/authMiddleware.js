const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    लॉगिन केलेल्या युजरला पडताळणे (Protect Route)
 */
exports.protect = async (req, res, next) => {
    let token;

    // 1. Header मध्ये 'Authorization: Bearer <token>' आहे का ते तपासणे
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // टोकन वेगळे करणे
            token = req.headers.authorization.split(' ')[1];

            // 2. टोकन डीकोड (Verify) करणे
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. डेटाबेसमधून युजरची माहिती मिळवणे (पासवर्ड सोडून)
            req.user = await User.findById(decoded.id).select('-password_hash');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User no longer exists.' });
            }

            next(); // सर्व काही बरोबर असल्यास पुढच्या फंक्शनकडे जाणे
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token found.' });
    }
};

/**
 * @desc    केवळ ॲडमिनला परवानगी देणे (Admin Only Access)
 */
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            message: 'Access denied. Only administrators can perform this action.' 
        });
    }
};

/**
 * @desc    प्रीमियम युजर आहे का ते तपासणे (Premium Tool Access)
 */
exports.isPremium = (req, res, next) => {
    if (req.user && (req.user.plan_type === 'premium' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(402).json({ 
            success: false, 
            message: 'This is a premium feature. Please upgrade your plan.' 
        });
    }
};
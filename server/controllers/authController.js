const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * @desc    Generate JWT Token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // १ महिना व्हॅलिड राहील
    });
};

/**
 * @desc    Register New User
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        // 1. युजर आधीच आहे का ते तपासणे
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // 2. पासवर्ड हॅश करणे (Security)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. नवीन युजर तयार करणे
        const user = await User.create({
            full_name,
            email,
            password_hash: hashedPassword,
            ip_address: req.ip
        });

        if (user) {
            res.status(201).json({
                success: true,
                _id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                plan_type: user.plan_type,
                token: generateToken(user._id),
                message: 'Registration successful!'
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error during registration' });
    }
};

/**
 * @desc    Login User
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. युजर शोधणे (सोबत पासवर्ड सुद्धा घेणे)
        const user = await User.findOne({ email }).select('+password_hash');

        if (user && (await bcrypt.compare(password, user.password_hash))) {
            
            // लॉगिन झाल्यावर माहिती अपडेट करणे
            user.last_login = Date.now();
            await user.save();

            res.json({
                success: true,
                _id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                plan_type: user.plan_type,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login Error' });
    }
};

/**
 * @desc    Get User Profile (Private)
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
    try {
        // req.user हा 'authMiddleware' मधून येतो
        const user = await User.findById(req.user._id).populate('subscription_id');

        if (user) {
            res.json({
                success: true,
                data: user
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Profile Fetch Error' });
    }
};

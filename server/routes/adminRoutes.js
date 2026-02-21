const express = require('express');
const router = express.Router();

// Controllers
const { 
    getDashboardStats, 
    getAllUsers, 
    getSystemHealth,
    updateUserByAdmin,
    deleteUserByAdmin,
    getTransactions,
    getReportSummary,
} = require('../controllers/adminController');

// Middlewares
const { protect, isAdmin } = require('../middleware/authMiddleware');

/**
 * सर्व Admin Routes ना 'protect' आणि 'isAdmin' मिडलवेअर लागू करणे
 * यामुळे सुरक्षितता वाढते (Security best practice)
 */
router.use(protect);
router.use(isAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard analytics (Revenue, Users, Files)
 * @access  Private (Admin Only)
 */
router.get('/stats', getDashboardStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all registered users with pagination
 * @access  Private (Admin Only)
 */
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUserByAdmin);
router.delete('/users/:id', deleteUserByAdmin);
router.get('/transactions', getTransactions);
router.get('/reports/summary', getReportSummary);

/**
 * @route   GET /api/admin/health
 * @desc    Check server health and storage usage
 * @access  Private (Admin Only)
 */
router.get('/health', getSystemHealth);

module.exports = router;

const User = require('../models/User');
const File = require('../models/File');
const Transaction = require('../models/Transaction');

/**
 * @desc    Get Overall Dashboard Stats
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // 1. एकाच वेळी सर्व महत्त्वाचे आकडे काढणे (Performance Optimized)
        const [userCount, premiumUserCount, fileStats, revenueStats] = await Promise.all([
            User.countDocuments({ is_deleted: { $ne: true } }),
            User.countDocuments({ plan_type: 'premium', is_deleted: { $ne: true } }),
            
            // फाइल्सचे एकूण काउंट आणि टूल्सनुसार वर्गीकरण
            File.aggregate([
                {
                    $group: {
                        _id: "$tool_used",
                        count: { $sum: 1 }
                    }
                }
            ]),

            // यशस्वी पेमेंटमधून झालेली एकूण कमाई
            Transaction.aggregate([
                { $match: { payment_status: 'success' } },
                { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
            ])
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers: userCount,
                premiumUsers: premiumUserCount,
                totalFilesProcessed: fileStats.reduce((acc, curr) => acc + curr.count, 0),
                toolUsageBreakdown: fileStats,
                totalRevenue: revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0,
                currency: 'INR'
            }
        });

    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ success: false, message: 'Admin data fetch failed.' });
    }
};

/**
 * @desc    Get All Users with Pagination
 * @route   GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const q = (req.query.q || '').trim();

        const query = { is_deleted: { $ne: true } };
        if (q) {
            query.$or = [
                { full_name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-password_hash'),
            User.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching users.' });
    }
};

/**
 * @desc    Update user role/plan by admin
 * @route   PATCH /api/admin/users/:id
 */
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, plan_type, subscription_status } = req.body;

        const updates = {};
        if (role && ['user', 'admin'].includes(role)) updates.role = role;
        if (plan_type && ['free', 'premium'].includes(plan_type)) updates.plan_type = plan_type;
        if (subscription_status && ['active', 'expired', 'cancelled'].includes(subscription_status)) {
            updates.subscription_status = subscription_status;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided.' });
        }

        const user = await User.findOneAndUpdate(
            { _id: id, is_deleted: { $ne: true } },
            { $set: updates },
            { returnDocument: 'after' }
        ).select('-password_hash');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({ success: true, message: 'User updated successfully.', data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update user.' });
    }
};

/**
 * @desc    Soft delete user by admin
 * @route   DELETE /api/admin/users/:id
 */
exports.deleteUserByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (String(req.user._id) === String(id)) {
            return res.status(400).json({ success: false, message: 'Admin cannot delete own account.' });
        }

        const user = await User.findOneAndUpdate(
            { _id: id, is_deleted: { $ne: true } },
            { $set: { is_deleted: true } },
            { returnDocument: 'after' }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
};

/**
 * @desc    System Health Check (Logs and Storage)
 */
exports.getSystemHealth = async (req, res) => {
    try {
        // S3 किंवा लोकल स्टोरेजचा वापर तपासण्यासाठी
        const storageStats = await User.aggregate([
            { $group: { _id: null, totalUsed: { $sum: "$total_storage_used" } } }
        ]);

        res.status(200).json({
            success: true,
            storageUsedMB: (storageStats[0]?.totalUsed / (1024 * 1024)).toFixed(2),
            status: 'Healthy',
            serverTime: new Date()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Health check failed.' });
    }
};

/**
 * @desc    Get transactions with pagination
 * @route   GET /api/admin/transactions
 */
exports.getTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
        const skip = (page - 1) * limit;
        const q = (req.query.q || '').trim();

        const query = {};
        if (q) {
            query.$or = [
                { transaction_id: { $regex: q, $options: 'i' } },
                { order_id: { $regex: q, $options: 'i' } },
                { invoice_number: { $regex: q, $options: 'i' } },
            ];
        }

        const [items, total] = await Promise.all([
            Transaction.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user_id', 'full_name email'),
            Transaction.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            count: items.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: items,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
    }
};

/**
 * @desc    Report summary for admin
 * @route   GET /api/admin/reports/summary
 */
exports.getReportSummary = async (req, res) => {
    try {
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const [filesLast30, txLast30, topTools] = await Promise.all([
            File.countDocuments({ createdAt: { $gte: since } }),
            Transaction.aggregate([
                { $match: { createdAt: { $gte: since }, payment_status: 'success' } },
                { $group: { _id: null, amount: { $sum: '$amount' } } },
            ]),
            File.aggregate([
                { $group: { _id: '$tool_used', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                rangeDays: 30,
                filesProcessedLast30Days: filesLast30,
                revenueLast30Days: txLast30[0]?.amount || 0,
                topTools,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to generate report summary.' });
    }
};

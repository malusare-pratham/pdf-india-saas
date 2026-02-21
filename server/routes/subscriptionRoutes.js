const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getPlans,
    getMySubscription,
    subscribePlan,
    cancelMySubscription,
} = require('../controllers/subscriptionController');

router.get('/plans', getPlans);
router.get('/me', protect, getMySubscription);
router.post('/subscribe', protect, subscribePlan);
router.post('/cancel', protect, cancelMySubscription);

module.exports = router;


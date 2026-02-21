const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { PLAN_CONFIG, createIdBundle } = require('../config/planConfig');

exports.getPlans = async (req, res) => {
    const plans = Object.values(PLAN_CONFIG).map((p) => ({
        code: p.planCode,
        name: p.displayName,
        amount: p.amount,
        durationDays: p.durationDays,
        currency: 'INR',
    }));

    return res.status(200).json({ success: true, data: plans });
};

exports.getMySubscription = async (req, res) => {
    const user = await User.findById(req.user._id).select(
        'plan_type subscription_status subscription_start_date subscription_end_date subscription_id'
    );

    let subscription = null;
    if (user.subscription_id) {
        subscription = await Subscription.findById(user.subscription_id);
    } else {
        subscription = await Subscription.findOne({ user_id: user._id }).sort({ createdAt: -1 });
    }

    return res.status(200).json({
        success: true,
        data: {
            plan_type: user.plan_type,
            subscription_status: user.subscription_status,
            subscription_start_date: user.subscription_start_date,
            subscription_end_date: user.subscription_end_date,
            subscription,
        },
    });
};

exports.subscribePlan = async (req, res) => {
    try {
        const { planCode } = req.body;
        const plan = PLAN_CONFIG[planCode];
        const paymentMethod = req.body.paymentMethod || 'mock';

        if (!plan) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (plan.planCode === 'free') {
            user.plan_type = 'free';
            user.subscription_status = 'expired';
            user.subscription_start_date = null;
            user.subscription_end_date = null;
            user.subscription_id = null;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Free plan activated.',
                data: {
                    user: {
                        _id: user._id,
                        full_name: user.full_name,
                        email: user.email,
                        role: user.role,
                        plan_type: user.plan_type,
                    },
                    subscription: null,
                },
            });
        }

        if (plan.amount > 0 && paymentMethod !== 'mock') {
            return res.status(400).json({
                success: false,
                message: 'Use payment verification flow for paid plans.',
            });
        }

        const now = new Date();
        const baseStart =
            user.subscription_end_date && user.subscription_end_date > now
                ? user.subscription_end_date
                : now;
        const endDate = new Date(baseStart.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
        const ids = createIdBundle();

        const subscription = await Subscription.create({
            user_id: user._id,
            plan_name: plan.subscriptionPlanName,
            plan_price: plan.amount,
            plan_duration_days: plan.durationDays,
            start_date: baseStart,
            end_date: endDate,
            status: 'active',
            payment_id: ids.paymentId,
        });

        await Transaction.create({
            user_id: user._id,
            subscription_id: subscription._id,
            payment_gateway: 'Razorpay',
            transaction_id: ids.transactionId,
            order_id: ids.orderId,
            amount: plan.amount,
            currency: 'INR',
            payment_status: 'success',
            invoice_number: ids.invoice,
            payment_method: paymentMethod,
            metadata: { planCode: plan.planCode },
        });

        user.plan_type = plan.userPlanType;
        user.subscription_status = 'active';
        user.subscription_start_date = baseStart;
        user.subscription_end_date = endDate;
        user.subscription_id = subscription._id;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `${plan.displayName} activated successfully.`,
            data: {
                user: {
                    _id: user._id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                    plan_type: user.plan_type,
                },
                subscription,
            },
        });
    } catch (error) {
        console.error('Subscribe Plan Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Subscription activation failed.',
        });
    }
};

exports.cancelMySubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const subscription = user.subscription_id
            ? await Subscription.findById(user.subscription_id)
            : await Subscription.findOne({ user_id: user._id, status: 'active' }).sort({ createdAt: -1 });

        if (subscription) {
            subscription.status = 'cancelled';
            await subscription.save();
        }

        user.plan_type = 'free';
        user.subscription_status = 'cancelled';
        user.subscription_id = null;
        user.subscription_end_date = new Date();
        await user.save();

        return res.status(200).json({ success: true, message: 'Subscription cancelled successfully.' });
    } catch (error) {
        console.error('Cancel Subscription Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to cancel subscription.' });
    }
};

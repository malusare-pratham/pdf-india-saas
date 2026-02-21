const crypto = require('crypto');
const Razorpay = require('razorpay');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { PLAN_CONFIG, createIdBundle } = require('../config/planConfig');

const getRazorpay = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        return null;
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

exports.createOrder = async (req, res) => {
    try {
        const { planCode } = req.body;
        const plan = PLAN_CONFIG[planCode];
        if (!plan || plan.amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid paid plan selected.' });
        }

        const razorpay = getRazorpay();
        if (!razorpay) {
            return res.status(500).json({
                success: false,
                message: 'Razorpay keys are not configured on server.',
            });
        }

        const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        const order = await razorpay.orders.create({
            amount: plan.amount * 100,
            currency: 'INR',
            receipt,
            notes: {
                userId: String(req.user._id),
                planCode: plan.planCode,
            },
        });

        const ids = createIdBundle();
        await Transaction.create({
            user_id: req.user._id,
            payment_gateway: 'Razorpay',
            transaction_id: `pending_${order.id}`,
            order_id: order.id,
            amount: plan.amount,
            currency: 'INR',
            payment_status: 'pending',
            invoice_number: ids.invoice,
            payment_method: 'razorpay',
            metadata: { planCode: plan.planCode, receipt },
        });

        return res.status(200).json({
            success: true,
            data: {
                keyId: process.env.RAZORPAY_KEY_ID,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                planCode: plan.planCode,
                planName: plan.displayName,
            },
        });
    } catch (error) {
        console.error('Create Order Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            planCode,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const plan = PLAN_CONFIG[planCode];
        if (!plan || plan.amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid paid plan selected.' });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return res.status(500).json({ success: false, message: 'Razorpay secret is missing.' });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });
        }

        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const isValid = generatedSignature === razorpay_signature;
        const pendingTxn = await Transaction.findOne({
            user_id: req.user._id,
            order_id: razorpay_order_id,
        }).sort({ createdAt: -1 });

        if (!isValid) {
            if (pendingTxn) {
                pendingTxn.payment_status = 'failed';
                pendingTxn.failure_reason = 'Invalid Razorpay signature';
                await pendingTxn.save();
            }
            return res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const now = new Date();
        const baseStart =
            user.subscription_end_date && user.subscription_end_date > now
                ? user.subscription_end_date
                : now;
        const endDate = new Date(baseStart.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        const subscription = await Subscription.create({
            user_id: user._id,
            plan_name: plan.subscriptionPlanName,
            plan_price: plan.amount,
            plan_duration_days: plan.durationDays,
            start_date: baseStart,
            end_date: endDate,
            status: 'active',
            payment_id: razorpay_payment_id,
        });

        if (pendingTxn) {
            pendingTxn.subscription_id = subscription._id;
            pendingTxn.transaction_id = razorpay_payment_id;
            pendingTxn.payment_status = 'success';
            pendingTxn.payment_method = 'razorpay';
            pendingTxn.metadata = {
                ...(pendingTxn.metadata || {}),
                planCode: plan.planCode,
                razorpayOrderId: razorpay_order_id,
            };
            await pendingTxn.save();
        } else {
            const ids = createIdBundle();
            await Transaction.create({
                user_id: user._id,
                subscription_id: subscription._id,
                payment_gateway: 'Razorpay',
                transaction_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                amount: plan.amount,
                currency: 'INR',
                payment_status: 'success',
                invoice_number: ids.invoice,
                payment_method: 'razorpay',
                metadata: { planCode: plan.planCode },
            });
        }

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
        console.error('Verify Payment Error:', error);
        return res.status(500).json({ success: false, message: 'Payment verification failed.' });
    }
};


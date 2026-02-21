const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    plan_name: { 
        type: String, 
        enum: ['free', 'premium_monthly', 'premium_yearly'], 
        default: 'free' 
    },
    plan_price: { type: Number, required: true },
    plan_duration_days: { type: Number, required: true },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['active', 'expired', 'cancelled'], 
        default: 'active',
        index: true 
    },
    payment_id: { 
        type: String, // Razorpay Payment ID or Transaction ref
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
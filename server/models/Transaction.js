const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true 
    },
    subscription_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subscription',
        index: true 
    },
    payment_gateway: { 
        type: String, 
        enum: ['Razorpay', 'Stripe'], 
        required: true 
    },
    transaction_id: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    order_id: { 
        type: String, 
        required: true 
    }, // Useful for Razorpay Order ID
    amount: { 
        type: Number, 
        required: true 
    },
    currency: { 
        type: String, 
        default: 'INR' 
    },
    payment_status: { 
        type: String, 
        enum: ['success', 'failed', 'pending', 'refunded'], 
        default: 'pending',
        index: true 
    },
    invoice_number: { 
        type: String, 
        unique: true 
    },
    payment_method: { 
        type: String 
    }, // e.g., 'card', 'upi', 'netbanking'
    failure_reason: { 
        type: String 
    },
    metadata: { 
        type: Object 
    } // Extra info for debugging
}, { timestamps: true });

// Index for Admin Analytics: Filter by date and status
transactionSchema.index({ createdAt: -1, payment_status: 1 });

// Static method to calculate total revenue (For Admin Dashboard)
transactionSchema.statics.getTotalRevenue = async function() {
    const stats = await this.aggregate([
        { $match: { payment_status: 'success' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return stats.length > 0 ? stats[0].total : 0;
};

module.exports = mongoose.model('Transaction', transactionSchema);
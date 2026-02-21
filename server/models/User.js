const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    plan_type: { type: String, enum: ['free', 'premium'], default: 'free', index: true },
    subscription_status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'expired' },
    subscription_start_date: Date,
    subscription_end_date: Date,
    total_files_processed: { type: Number, default: 0 },
    total_storage_used: { type: Number, default: 0 }, // in bytes
    is_verified: { type: Boolean, default: false },
    last_login: Date,
    ip_address: String,
    is_deleted: { type: Boolean, default: false },
    subscription_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        default: null
    }
}, { timestamps: true });

// Index for search performance
userSchema.index({ email: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);

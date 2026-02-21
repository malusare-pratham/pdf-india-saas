const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    original_file_name: String,
    processed_file_name: String,
    s3_original_url: String,
    s3_processed_url: String,
    tool_used: { 
        type: String, 
        enum: ['merge', 'split', 'compress', 'convert', 'govt_compress', 'student_mode'],
        index: true 
    },
    original_file_size: Number,
    processed_file_size: Number,
    compression_ratio: Number,
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued', index: true },
    is_premium_used: { type: Boolean, default: false },
    auto_delete_at: { type: Date, required: true }, // TTL Index logic
    deleted_at: Date
}, { timestamps: true });

// Auto-delete file record from DB after 24 hours (SaaS Standard)
fileSchema.index({ "auto_delete_at": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('File', fileSchema);
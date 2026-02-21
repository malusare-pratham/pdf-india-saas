const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const File = require('../models/File');

const toToolLabel = (toolUsed) => {
    const map = {
        merge: 'Merge PDF',
        split: 'Split PDF',
        compress: 'Compress PDF',
        convert: 'Convert',
        govt_compress: 'Govt Resize',
        student_mode: 'Student Mode',
    };
    return map[toolUsed] || toolUsed;
};

exports.getMyFiles = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

        const files = await File.find({ user_id: req.user._id, status: 'completed' })
            .sort({ createdAt: -1 })
            .limit(limit);

        const data = files.map((file) => ({
            id: file._id,
            fileName: file.processed_file_name || file.original_file_name,
            originalFileName: file.original_file_name,
            toolUsed: file.tool_used,
            toolLabel: toToolLabel(file.tool_used),
            createdAt: file.createdAt,
            originalSize: file.original_file_size || 0,
            processedSize: file.processed_file_size || 0,
            downloadUrl: file.s3_processed_url,
        }));

        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch file history.' });
    }
};

exports.deleteMyFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await File.findOne({ _id: id, user_id: req.user._id });

        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found.' });
        }

        if (file.s3_processed_url && file.s3_processed_url.startsWith('/uploads/')) {
            const filename = path.basename(file.s3_processed_url);
            const localPath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(localPath)) {
                await fsp.unlink(localPath);
            }
        }

        await File.deleteOne({ _id: file._id });
        return res.status(200).json({ success: true, message: 'File deleted successfully.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete file.' });
    }
};


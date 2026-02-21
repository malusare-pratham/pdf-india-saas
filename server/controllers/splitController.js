const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const File = require('../models/File');
const User = require('../models/User');
const { resolveUploadedFilePath } = require('../utils/helpers');

/**
 * @desc    Split PDF by range selection
 * @route   POST /api/pdf/split
 * @access  Public / Premium
 */
exports.splitPDF = async (req, res) => {
    try {
        const { startPage, endPage } = req.body; // युजरकडून आलेली रेंज
        const file = req.file; // Multer द्वारे आलेली सिंगल फाईल

        if (!file) {
            return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
        }

        if (!startPage || !endPage || startPage <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid page range.' });
        }

        // 1. मूळ PDF लोड करा
        const filePath = resolveUploadedFilePath(file.path);
        const existingPdfBytes = await fs.readFile(filePath);
        const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
        
        const totalPages = existingPdfDoc.getPageCount();

        // 2. रेंज चेक करा (Range validation)
        if (endPage > totalPages || startPage > endPage) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid range. This PDF only has ${totalPages} pages.` 
            });
        }

        // 3. नवीन रिकामी PDF तयार करा
        const newPdfDoc = await PDFDocument.create();

        // 4. ठराविक पानांची इंडेक्स लिस्ट तयार करा (0-based index)
        const pagesToExtract = [];
        for (let i = startPage - 1; i < endPage; i++) {
            pagesToExtract.push(i);
        }

        // 5. पाने कॉपी करा आणि नवीन डॉक्युमेंटमध्ये जोडा
        const copiedPages = await newPdfDoc.copyPages(existingPdfDoc, pagesToExtract);
        copiedPages.forEach((page) => newPdfDoc.addPage(page));

        // 6. फाईल सेव्ह करा
        const splitPdfBytes = await newPdfDoc.save();
        const fileName = `split-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../uploads/', fileName);

        await fs.writeFile(outputPath, splitPdfBytes);

        // 7. Database मध्ये नोंद करा
        const fileRecord = await File.create({
            user_id: req.user ? req.user._id : null,
            original_file_name: file.originalname,
            processed_file_name: fileName,
            s3_processed_url: `/uploads/${fileName}`,
            tool_used: 'split',
            original_file_size: file.size,
            processed_file_size: splitPdfBytes.length,
            status: 'completed',
            auto_delete_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 तासानंतर डिलीट
        });

        // 8. User statistics अपडेट करा
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { $inc: { total_files_processed: 1 } });
        }

        res.status(200).json({
            success: true,
            message: 'PDF split successfully!',
            downloadUrl: fileRecord.s3_processed_url,
            data: fileRecord
        });

    } catch (error) {
        console.error('Split Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing PDF split.',
            error: error.message
        });
    }
};

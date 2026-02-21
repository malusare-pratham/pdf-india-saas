const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');
const File = require('../models/File');
const User = require('../models/User');
const { resolveUploadedFilePath } = require('../utils/helpers');

/**
 * @desc    Merge multiple PDF files into one
 * @route   POST /api/pdf/merge
 * @access  Public (with limits) / Premium
 */
exports.mergePDFs = async (req, res, next) => {
    try {
        const files = req.files; // Uploaded via Multer

        if (!files || files.length < 2) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please upload at least 2 PDF files to merge.' 
            });
        }

        // 1. Create a new PDF Document
        const mergedPdf = await PDFDocument.create();

        // 2. Loop through all uploaded files and add their pages
        for (const file of files) {
            const filePath = resolveUploadedFilePath(file.path);
            if (!filePath || !fsSync.existsSync(filePath)) {
                return res.status(400).json({
                    success: false,
                    message: `Uploaded file not found: ${file.originalname}`,
                });
            }

            const pdfBytes = await fs.readFile(filePath);
            let pdfDoc;
            try {
                pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            } catch (pdfError) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid or unsupported PDF: ${file.originalname}`,
                });
            }
            
            // Copy all pages from current PDF to the merged PDF
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        // 3. Serialize the PDF to bytes
        const mergedPdfBytes = await mergedPdf.save();

        // 4. Generate names and paths for the processed file
        const fileName = `merged-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../uploads/', fileName);

        // 5. Save merged file to disk (or S3 in future)
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, mergedPdfBytes);

        // 6. Record the transaction in Database
        const fileRecord = await File.create({
            user_id: req.user ? req.user._id : null, // If logged in
            original_file_name: files.map(f => f.originalname).join(', '),
            processed_file_name: fileName,
            s3_processed_url: `/uploads/${fileName}`, // URL for download
            tool_used: 'merge',
            original_file_size: files.reduce((acc, f) => acc + f.size, 0),
            processed_file_size: mergedPdfBytes.length,
            status: 'completed',
            auto_delete_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        });

        // 7. Update User stats if user is logged in
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { total_files_processed: 1 }
            });
        }

        // 8. Send Response
        res.status(200).json({
            success: true,
            message: 'PDFs merged successfully!',
            downloadUrl: fileRecord.s3_processed_url,
            data: fileRecord
        });

    } catch (error) {
        console.error('Merge Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'An error occurred while merging PDFs.',
            error: error.message
        });
    }
};

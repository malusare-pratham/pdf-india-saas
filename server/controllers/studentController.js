const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const File = require('../models/File');
const { resolveUploadedFilePath } = require('../utils/helpers');

/**
 * @desc    Student Mode: Assignment PDF Clean-up & Formatting
 * @route   POST /api/pdf/student-mode
 * @access  Public / Premium
 */
exports.processStudentPDF = async (req, res) => {
    try {
        const files = req.files;
        const { scanClean, autoMargin, brightness } = req.body;

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'Please upload assignment images or PDF.' });
        }

        const mergedPdf = await PDFDocument.create();
        const withScanClean = scanClean === 'true';
        const withAutoMargin = autoMargin === 'true';

        for (const file of files) {
            const inputPath = resolveUploadedFilePath(file.path);
            const inputBuffer = await fs.readFile(inputPath);
            const ext = path.extname(file.originalname).toLowerCase();

            if (ext === '.pdf') {
                const sourcePdf = await PDFDocument.load(inputBuffer);
                const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
                continue;
            }

            let image;
            if (withScanClean) {
                const cleaned = await sharp(inputBuffer)
                    .grayscale()
                    .modulate({
                        brightness: parseFloat(brightness) || 1.2,
                        saturation: 0.8,
                    })
                    .normalize()
                    .jpeg({ quality: 88 })
                    .toBuffer();
                image = await mergedPdf.embedJpg(cleaned);
            } else if (ext === '.png') {
                image = await mergedPdf.embedPng(inputBuffer);
            } else if (ext === '.jpg' || ext === '.jpeg') {
                image = await mergedPdf.embedJpg(inputBuffer);
            } else {
                return res.status(400).json({ success: false, message: `Unsupported file format: ${ext}` });
            }

            const page = mergedPdf.addPage([595.28, 841.89]);
            const margin = withAutoMargin ? 40 : 0;
            const maxWidth = 595.28 - margin * 2;
            const maxHeight = 841.89 - margin * 2;
            const dims = image.scaleToFit(maxWidth, maxHeight);

            page.drawImage(image, {
                x: (page.getWidth() - dims.width) / 2,
                y: (page.getHeight() - dims.height) / 2,
                width: dims.width,
                height: dims.height,
            });
        }

        const pdfBytes = await mergedPdf.save();
        const fileName = `student-assignment-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../uploads/', fileName);

        await fs.writeFile(outputPath, pdfBytes);

        const fileRecord = await File.create({
            user_id: req.user ? req.user._id : null,
            original_file_name: `Assignment-${files.length}-pages.pdf`,
            processed_file_name: fileName,
            s3_processed_url: `/uploads/${fileName}`,
            tool_used: 'student_mode',
            original_file_size: files.reduce((acc, f) => acc + f.size, 0),
            processed_file_size: pdfBytes.length,
            status: 'completed',
            auto_delete_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
        });

        return res.status(200).json({
            success: true,
            message: 'Assignment cleaned and formatted successfully!',
            downloadUrl: fileRecord.s3_processed_url,
            data: fileRecord,
        });
    } catch (error) {
        console.error('Student Mode Error:', error);
        return res.status(500).json({ success: false, message: 'Processing failed.' });
    }
};

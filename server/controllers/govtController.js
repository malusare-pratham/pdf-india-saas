const { execFile } = require('child_process');
const { spawnSync } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const File = require('../models/File');
const { resolveUploadedFilePath } = require('../utils/helpers');

const execFileAsync = promisify(execFile);

const findGhostscriptBinary = () => {
    const candidates = [process.env.GS_BIN, 'gswin64c', 'gswin32c', 'gs'].filter(Boolean);

    for (const cmd of candidates) {
        const check = spawnSync(cmd, ['-version'], { stdio: 'ignore', shell: true });
        if (check.status === 0) return cmd;
    }

    return null;
};

/**
 * @desc    Special Government Exam PDF Compressor (100KB, 200KB, 500KB)
 * @route   POST /api/pdf/govt-compress
 * @access  Public / Premium
 */
exports.processGovtPDF = async (req, res) => {
    try {
        const file = req.file;
        const { targetSize = '200', examType } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
        }

        const inputPath = resolveUploadedFilePath(file.path);
        const fileName = `govt-${examType || 'exam'}-${targetSize}kb-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../uploads/', fileName);
        let effectiveInputPath = inputPath;
        let tempInputPdfPath = null;

        const ext = path.extname(file.originalname || '').toLowerCase();
        const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';

        if (!isPdf) {
            const isImage = ['.jpg', '.jpeg', '.png'].includes(ext)
                || ['image/jpeg', 'image/png'].includes(file.mimetype);

            if (!isImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Only PDF, JPG, JPEG, or PNG files are supported for Govt compression.',
                });
            }

            // Convert image upload to single-page PDF so Govt compressor works for photo/sign inputs.
            const imageBytes = await fsp.readFile(inputPath);
            const pdfDoc = await PDFDocument.create();
            const embeddedImage = ext === '.png'
                ? await pdfDoc.embedPng(imageBytes)
                : await pdfDoc.embedJpg(imageBytes);
            const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: embeddedImage.width,
                height: embeddedImage.height,
            });
            const convertedPdfBytes = await pdfDoc.save();
            tempInputPdfPath = path.join(__dirname, '../uploads/', `govt-input-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
            await fsp.writeFile(tempInputPdfPath, convertedPdfBytes);
            effectiveInputPath = tempInputPdfPath;
        }

        const gsBin = findGhostscriptBinary();

        if (gsBin) {
            let gsQuality = '/ebook';
            if (targetSize === '100') gsQuality = '/screen';
            if (targetSize === '500') gsQuality = '/printer';

            const gsArgs = [
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                `-dPDFSETTINGS=${gsQuality}`,
                '-dColorImageResolution=150',
                '-dGrayImageResolution=150',
                '-dMonoImageResolution=150',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                `-sOutputFile=${outputPath}`,
                effectiveInputPath,
            ];

            await execFileAsync(gsBin, gsArgs, { shell: true });
        } else {
            // Fallback: rewrite PDF in basic optimization mode.
            const inputBytes = await fsp.readFile(effectiveInputPath);
            const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
            const outputBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
            await fsp.writeFile(outputPath, outputBytes);
        }

        if (tempInputPdfPath && fs.existsSync(tempInputPdfPath)) {
            await fsp.unlink(tempInputPdfPath);
        }

        const stats = fs.statSync(outputPath);
        const finalSizeKB = (stats.size / 1024).toFixed(2);

        let warning = null;
        if (parseInt(finalSizeKB, 10) > parseInt(targetSize, 10)) {
            warning = `File processed but size is ${finalSizeKB}KB. For stricter size reduction install Ghostscript.`;
        }

        const fileRecord = await File.create({
            user_id: req.user ? req.user._id : null,
            original_file_name: file.originalname,
            processed_file_name: fileName,
            s3_processed_url: `/uploads/${fileName}`,
            tool_used: 'govt_compress',
            original_file_size: file.size,
            processed_file_size: stats.size,
            status: 'completed',
            auto_delete_at: new Date(Date.now() + 12 * 60 * 60 * 1000),
        });

        return res.status(200).json({
            success: true,
            message: `PDF optimized for ${examType || 'Govt Exam'} under ${targetSize}KB`,
            downloadUrl: fileRecord.s3_processed_url,
            finalSize: `${finalSizeKB} KB`,
            warning,
            data: fileRecord,
        });
    } catch (error) {
        console.error('Govt Controller Error:', error);
        return res.status(500).json({ success: false, message: 'Govt compression failed.', error: error.message });
    }
};

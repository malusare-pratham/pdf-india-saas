const { execFile } = require('child_process');
const { spawnSync } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const File = require('../models/File');
const User = require('../models/User');
const { resolveUploadedFilePath } = require('../utils/helpers');

const execFileAsync = promisify(execFile);
const BYTES_PER_MB = 1000 * 1000;

const findGhostscriptBinary = () => {
    const candidates = [process.env.GS_BIN, 'gswin64c', 'gswin32c', 'gs'].filter(Boolean);

    for (const cmd of candidates) {
        const check = spawnSync(cmd, ['-version'], { stdio: 'ignore', shell: true });
        if (check.status === 0) return cmd;
    }

    return null;
};

const runGhostscriptCompression = async ({
    gsBin,
    inputPath,
    outputPath,
    compressionLevel,
    resolution,
}) => {
    let gsSetting = '/ebook';
    if (compressionLevel === 'high' || compressionLevel === 'govt_100' || compressionLevel === 'extreme') {
        gsSetting = '/screen';
    }
    if (compressionLevel === 'low') {
        gsSetting = '/printer';
    }

    const gsArgs = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        `-dPDFSETTINGS=${gsSetting}`,
        '-dDownsampleColorImages=true',
        '-dDownsampleGrayImages=true',
        '-dDownsampleMonoImages=true',
        `-dColorImageResolution=${resolution}`,
        `-dGrayImageResolution=${resolution}`,
        `-dMonoImageResolution=${Math.max(72, resolution)}`,
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${outputPath}`,
        inputPath,
    ];

    await execFileAsync(gsBin, gsArgs, { shell: true });
};

const padPdfToExactSize = async (filePath, targetBytes) => {
    const stats = fs.statSync(filePath);
    if (stats.size === targetBytes) return true;
    if (stats.size > targetBytes) return false;

    const diff = targetBytes - stats.size;
    // Trailing spaces after EOF are ignored by PDF readers and keep file valid.
    await fsp.appendFile(filePath, Buffer.alloc(diff, 0x20));
    return true;
};

const parseTargetBytes = (body = {}) => {
    const directMB = Number(body.targetSizeMB);
    if (Number.isFinite(directMB) && directMB > 0) {
        return Math.round(directMB * BYTES_PER_MB);
    }

    const rawTarget = Number(body.targetSize);
    const unit = String(body.targetSizeUnit || body.targetUnit || 'MB').toUpperCase();
    if (!Number.isFinite(rawTarget) || rawTarget <= 0) {
        return 0;
    }

    if (unit === 'KB') return Math.round(rawTarget * 1000);
    return Math.round(rawTarget * BYTES_PER_MB);
};

const persistCompressionResult = async ({ req, file, fileName, outputPath, toolUsed = 'compress', message }) => {
    const stats = fs.statSync(outputPath);
    const ratio = file.size > 0 ? ((file.size - stats.size) / file.size) * 100 : 0;

    const fileRecord = await File.create({
        user_id: req.user ? req.user._id : null,
        original_file_name: file.originalname,
        processed_file_name: fileName,
        s3_processed_url: `/uploads/${fileName}`,
        tool_used: toolUsed,
        original_file_size: file.size,
        processed_file_size: stats.size,
        compression_ratio: ratio.toFixed(2),
        status: 'completed',
        auto_delete_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { total_files_processed: 1 } });
    }

    return {
        success: true,
        message,
        downloadUrl: fileRecord.s3_processed_url,
        originalSize: `${(file.size / 1024).toFixed(2)} KB`,
        compressedSize: `${(stats.size / 1024).toFixed(2)} KB`,
        ratio: `${fileRecord.compression_ratio}%`,
    };
};

/**
 * @desc    Compress PDF (Low/Medium/High/Govt Presets)
 * @route   POST /api/pdf/compress
 * @access  Public / Premium
 */
exports.compressPDF = async (req, res) => {
    try {
        const file = req.file;
        const { compressionLevel } = req.body;
        const targetBytes = parseTargetBytes(req.body);
        const targetSizeMB = targetBytes > 0 ? (targetBytes / BYTES_PER_MB) : 0;
        const hasTarget = targetBytes > 0;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
        }

        if (hasTarget && targetBytes > (200 * BYTES_PER_MB)) {
            return res.status(400).json({ success: false, message: 'Target size should be 200MB or less.' });
        }

        const inputPath = resolveUploadedFilePath(file.path);
        const fileName = `compressed-${Date.now()}-${file.originalname}`;
        const outputPath = path.join(__dirname, '../uploads/', fileName);

        const gsBin = findGhostscriptBinary();

        if (gsBin) {
            if (hasTarget) {
                const candidateResolutions = [220, 180, 150, 130, 110, 95, 80, 70, 60, 50, 40, 32, 24];
                let bestPath = null;
                let bestSize = Number.MAX_SAFE_INTEGER;
                let achieved = false;

                for (const resolution of candidateResolutions) {
                    const tempOutPath = `${outputPath}.r${resolution}.pdf`;
                    await runGhostscriptCompression({
                        gsBin,
                        inputPath,
                        outputPath: tempOutPath,
                        compressionLevel,
                        resolution,
                    });

                    const currentSize = fs.statSync(tempOutPath).size;

                    if (currentSize < bestSize) {
                        if (bestPath && fs.existsSync(bestPath)) fs.unlinkSync(bestPath);
                        bestPath = tempOutPath;
                        bestSize = currentSize;
                    } else if (fs.existsSync(tempOutPath)) {
                        fs.unlinkSync(tempOutPath);
                    }

                    if (currentSize <= targetBytes) {
                        achieved = true;
                        break;
                    }
                }

                if (!bestPath || !fs.existsSync(bestPath)) {
                    return res.status(500).json({ success: false, message: 'Compression failed to generate output.' });
                }
                fs.renameSync(bestPath, outputPath);
                const exactDone = await padPdfToExactSize(outputPath, targetBytes);

                const payload = await persistCompressionResult({
                    req,
                    file,
                    fileName,
                    outputPath,
                    message: achieved && exactDone
                        ? `PDF compressed to exact requested size (${targetSizeMB} MB).`
                        : `Closest possible size generated. Could not reach exact ${targetSizeMB} MB target.`,
                });

                return res.status(200).json({
                    ...payload,
                    targetSizeMB,
                });
            }

            await runGhostscriptCompression({
                gsBin,
                inputPath,
                outputPath,
                compressionLevel,
                resolution: 150,
            });

            const payload = await persistCompressionResult({
                req,
                file,
                fileName,
                outputPath,
                message: 'PDF compressed successfully!',
            });

            return res.status(200).json(payload);
        }

        // Fallback without Ghostscript: rewrite PDF streams to reduce size where possible.
        const inputBytes = await fsp.readFile(inputPath);
        const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
        const outputBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
        await fsp.writeFile(outputPath, outputBytes);

        let fallbackMessage = 'PDF optimized successfully (basic mode). Install Ghostscript for stronger compression.';
        if (hasTarget) {
            const exactDone = await padPdfToExactSize(outputPath, targetBytes);
            if (exactDone) {
                fallbackMessage = `PDF compressed to exact requested size (${targetSizeMB} MB).`;
            } else {
                fallbackMessage = `Closest possible size generated in basic mode. Install Ghostscript for exact or stronger compression to ${targetSizeMB} MB.`;
            }
        }

        const payload = await persistCompressionResult({
            req,
            file,
            fileName,
            outputPath,
            message: fallbackMessage,
        });

        return res.status(200).json(payload);
    } catch (error) {
        console.error('Compress Error:', error);
        return res.status(500).json({ success: false, message: 'Compression failed.', error: error.message });
    }
};

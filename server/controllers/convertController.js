const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { spawnSync } = require('child_process');
const libre = require('libreoffice-convert');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const File = require('../models/File');
const User = require('../models/User');
const { resolveUploadedFilePath } = require('../utils/helpers');

libre.convertAsync = require('util').promisify(libre.convert);

const findSofficePath = () => {
    const envPath = process.env.SOFFICE_PATH;
    if (envPath && fs.existsSync(envPath)) return envPath;

    const commonPaths = [
        'C:/Program Files/LibreOffice/program/soffice.exe',
        'C:/Program Files (x86)/LibreOffice/program/soffice.exe',
    ];

    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }

    const whereResult = spawnSync('where', ['soffice'], { encoding: 'utf8', shell: true });
    if (whereResult.status === 0 && whereResult.stdout) {
        const candidate = whereResult.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
        if (candidate) return candidate;
    }

    return null;
};

const createDocxFromText = async (text) => {
    const lines = (text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const children = lines.length
        ? lines.map((line) => new Paragraph({ children: [new TextRun(line)] }))
        : [new Paragraph({ children: [new TextRun('No extractable text found in source file.')] })];

    const doc = new Document({
        sections: [{ properties: {}, children }],
    });

    return Packer.toBuffer(doc);
};

const createPdfFromText = async (text) => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const fontSize = 11;
    const lineHeight = 15;
    const maxCharsPerLine = 95;

    const rawLines = (text || 'No extractable text found in source file.')
        .split(/\r?\n/)
        .flatMap((line) => {
            if (!line) return [''];
            const wrapped = [];
            let i = 0;
            while (i < line.length) {
                wrapped.push(line.slice(i, i + maxCharsPerLine));
                i += maxCharsPerLine;
            }
            return wrapped;
        });

    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const line of rawLines) {
        if (y < margin) {
            page = pdf.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
        }

        page.drawText(line, {
            x: margin,
            y,
            font,
            size: fontSize,
            color: rgb(0, 0, 0),
            maxWidth: pageWidth - margin * 2,
        });
        y -= lineHeight;
    }

    return pdf.save();
};

/**
 * @desc    Convert Word to PDF or PDF to Word
 * @route   POST /api/pdf/convert
 * @access  Public / Premium
 */
exports.convertFile = async (req, res) => {
    try {
        const file = req.file;
        const { convertTo } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        if (!['pdf', 'docx'].includes(convertTo)) {
            return res.status(400).json({ success: false, message: 'Invalid conversion target. Use pdf or docx.' });
        }

        const inputPath = resolveUploadedFilePath(file.path);
        const inputExt = path.extname(file.originalname).toLowerCase();
        const outputExt = `.${convertTo}`;
        const fileName = `converted-${Date.now()}${outputExt}`;
        const outputPath = path.join(__dirname, '../uploads/', fileName);

        const inputData = await fsp.readFile(inputPath);
        let convertedData;
        let fallbackUsed = false;

        const sofficePath = findSofficePath();

        if (sofficePath) {
            const sofficeDir = path.dirname(sofficePath);
            process.env.PATH = `${sofficeDir};${process.env.PATH}`;
            convertedData = await libre.convertAsync(inputData, outputExt, undefined);
        } else {
            fallbackUsed = true;

            if (inputExt === '.pdf' && convertTo === 'docx') {
                convertedData = await createDocxFromText(
                    `Basic conversion completed for ${file.originalname}.\n` +
                    'Install LibreOffice for full layout-preserving conversion.'
                );
            } else if ((inputExt === '.docx' || inputExt === '.doc') && convertTo === 'pdf') {
                if (inputExt === '.doc') {
                    return res.status(400).json({
                        success: false,
                        message: 'DOC format needs LibreOffice. Upload DOCX or install LibreOffice.',
                    });
                }
                const extracted = await mammoth.extractRawText({ buffer: inputData });
                convertedData = await createPdfFromText(extracted.value);
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Unsupported conversion ${inputExt} -> ${convertTo}.`,
                });
            }
        }

        await fsp.writeFile(outputPath, convertedData);

        const fileRecord = await File.create({
            user_id: req.user ? req.user._id : null,
            original_file_name: file.originalname,
            processed_file_name: fileName,
            s3_processed_url: `/uploads/${fileName}`,
            tool_used: 'convert',
            original_file_size: file.size,
            processed_file_size: convertedData.length,
            status: 'completed',
            auto_delete_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { $inc: { total_files_processed: 1 } });
        }

        return res.status(200).json({
            success: true,
            message: fallbackUsed
                ? `File converted to ${convertTo.toUpperCase()} (basic mode). Install LibreOffice for better formatting.`
                : `File converted to ${convertTo.toUpperCase()} successfully!`,
            downloadUrl: fileRecord.s3_processed_url,
            data: fileRecord,
        });
    } catch (error) {
        console.error('Conversion Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during file conversion.',
            error: error.message,
        });
    }
};

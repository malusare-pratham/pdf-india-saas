const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Service to handle high-level PDF compression using Ghostscript
 */
class CompressService {
    /**
     * @param {Object} file - Multer file object
     * @param {String} level - 'low', 'medium', 'high', 'govt_100'
     */
    async compressPDF(file, level = 'medium') {
        try {
            const inputPath = path.resolve(file.path);
            const fileName = `compressed-${Date.now()}-${file.originalname}`;
            const outputPath = path.join(__dirname, '../uploads/', fileName);

            /**
             * Ghostscript PDF Settings:
             * /screen  = High Compression, Low Quality (72 dpi) - Best for 100KB limits
             * /ebook   = Medium Compression, Medium Quality (150 dpi)
             * /printer = Low Compression, High Quality (300 dpi)
             */
            let gsSetting = '/ebook'; 
            
            switch (level) {
                case 'high':
                case 'govt_100':
                    gsSetting = '/screen';
                    break;
                case 'low':
                    gsSetting = '/printer';
                    break;
                default:
                    gsSetting = '/ebook';
            }

            // Ghostscript Command: प्रोफेशनल दर्जाचे कॉन्फिगरेशन
            const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;

            // कमांड रन करणे
            await execPromise(gsCommand);

            // नवीन फाईलची माहिती मिळवणे
            const stats = await fs.stat(outputPath);

            return {
                fileName,
                outputPath,
                originalSize: file.size,
                compressedSize: stats.size,
                compressionRatio: ((file.size - stats.size) / file.size * 100).toFixed(2) + '%',
                success: true
            };

        } catch (error) {
            console.error('Compress Service Error:', error);
            throw new Error('Ghostscript compression failed. Ensure GS is installed on server.');
        }
    }
}

module.exports = new CompressService();
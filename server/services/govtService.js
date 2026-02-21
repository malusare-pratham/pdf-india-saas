const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Service to handle India-specific Government Form PDF requirements
 */
class GovtService {
    /**
     * @param {Object} file - Multer file object
     * @param {String} targetSize - '100', '200', '500' (in KB)
     * @param {String} examType - 'SSC', 'UPSC', 'Passport', etc.
     */
    async compressForGovtPortal(file, targetSize = '200', examType = 'General') {
        try {
            const inputPath = path.resolve(file.path);
            const fileName = `govt-${examType}-${targetSize}kb-${Date.now()}.pdf`;
            const outputPath = path.join(__dirname, '../uploads/', fileName);

            /**
             * Optimization Logic for Indian Portals:
             * सरकारी वेबसाइट्सना अनेकदा कमी DPI पण स्पष्ट मजकूर लागतो.
             */
            let gsQuality = '/ebook'; // Default 150 DPI
            
            if (targetSize === '100') {
                gsQuality = '/screen'; // 72 DPI (सर्वात लहान साईज)
            } else if (targetSize === '500') {
                gsQuality = '/printer'; // 300 DPI (मोठी साईज, पासपोर्टसाठी उत्तम)
            }

            // Ghostscript command with specific optimizations for Indian Govt sites
            // -dColorImageResolution=150: मजकूर वाचनीय ठेवण्यासाठी इमेजेसचे रिझोल्यूशन सेट करणे
            const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
                -dPDFSETTINGS=${gsQuality} \
                -dColorImageResolution=150 -dGrayImageResolution=150 -dMonoImageResolution=150 \
                -dNOPAUSE -dQUIET -dBATCH \
                -sOutputFile=${outputPath} ${inputPath}`;

            await execPromise(gsCommand);

            const stats = await fs.stat(outputPath);
            const finalSizeKB = (stats.size / 1024).toFixed(2);

            return {
                fileName,
                outputPath,
                originalSize: (file.size / 1024).toFixed(2) + ' KB',
                finalSize: finalSizeKB + ' KB',
                targetLimit: targetSize + ' KB',
                isWithinLimit: parseInt(finalSizeKB) <= parseInt(targetSize),
                examType,
                success: true
            };

        } catch (error) {
            console.error('Govt Service Error:', error);
            throw new Error('Failed to process government-standard PDF.');
        }
    }
}

module.exports = new GovtService();
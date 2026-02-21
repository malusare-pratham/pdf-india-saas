const path = require('path');
const fs = require('fs').promises;
const libre = require('libreoffice-convert');
const util = require('util');

// LibreOffice ला Promise-based बनवण्यासाठी
libre.convertAsync = util.promisify(libre.convert);

/**
 * Service to handle document conversions (Word to PDF, etc.)
 */
class ConvertService {
    /**
     * @param {Object} file - Multer file object
     * @param {String} format - 'pdf' or 'docx'
     */
    async convertDocument(file, format = 'pdf') {
        try {
            const inputPath = path.resolve(file.path);
            const fileName = `converted-${Date.now()}.${format}`;
            const outputPath = path.join(__dirname, '../uploads/', fileName);

            // 1. मूळ फाईलचा डेटा वाचणे
            const inputData = await fs.readFile(inputPath);

            // 2. LibreOffice इंजिन वापरून कन्व्हर्जन करणे
            // हे इंजिन डॉक्युमेंटचे फॉरमॅटिंग जसेच्या तसे ठेवण्याचा प्रयत्न करते
            const convertedData = await libre.convertAsync(inputData, `.${format}`, undefined);

            // 3. नवीन फाईल डिस्कवर सेव्ह करणे
            await fs.writeFile(outputPath, convertedData);

            return {
                fileName,
                outputPath,
                originalSize: file.size,
                convertedSize: convertedData.length,
                format: format.toUpperCase(),
                success: true
            };

        } catch (error) {
            console.error('Convert Service Error:', error);
            throw new Error('Conversion failed. Ensure LibreOffice is installed and configured on the server.');
        }
    }
}

module.exports = new ConvertService();
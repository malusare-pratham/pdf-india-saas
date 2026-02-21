const fs = require('fs');
const path = require('path');

/**
 * Utility Helper Functions
 */

/**
 * १. फाईल साईज फॉरमॅट करणे (Bytes to KB/MB)
 * @param {Number} bytes 
 */
exports.formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * २. फाईल नेम सुरक्षित करणे (Sanitize Filename)
 * युजरने फाईल नेममध्ये विशेष चिन्हे वापरली असतील तर ती काढणे
 */
exports.getSafeFileName = (originalName) => {
    return originalName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
};

/**
 * ३. फाईल अस्तित्वात आहे का तपासणे
 */
exports.fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (err) {
        return false;
    }
};

/**
 * ४. रँडम स्ट्रिंग जनरेट करणे (Transaction ID किंवा OTP साठी)
 */
exports.generateRandomString = (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2).toUpperCase();
};

/**
 * ५. फाईल एक्सटेंशन मिळवणे
 */
exports.getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

/**
 * Resolve Multer file path safely for both absolute and relative storage paths.
 */
exports.resolveUploadedFilePath = (filePath) => {
    if (!filePath) return '';
    if (path.isAbsolute(filePath)) return filePath;
    return path.join(__dirname, '../', filePath);
};

/**
 * ६. डेटाबेसमधील नफा (Profit) कॅल्क्युलेट करणे
 */
exports.calculateTax = (amount, taxPercentage = 18) => {
    const taxAmount = (amount * taxPercentage) / 100;
    return {
        original: amount,
        tax: taxAmount,
        total: amount + taxAmount
    };
};

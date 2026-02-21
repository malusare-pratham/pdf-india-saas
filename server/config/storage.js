const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getSafeFileName } = require('../utils/helpers');

/**
 * फाईल्स साठवण्यासाठीची जागा आणि नियमावली
 */

// १. फाईल स्टोअरेज डेस्टिनेशन (Disk Storage)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // युजरनुसार वेगळे फोल्डर्स तयार केल्यास प्रायव्हसी चांगली राहते
        // सध्यातरी आपण सर्व 'uploads/' मध्ये ठेवत आहोत
        const uploadDir = path.join(__dirname, '../../uploads');

        // जर डिरेक्टरी नसेल तर ती तयार करणे (Recursive: true)
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // फाईलचे नाव युनिक करण्यासाठी: Timestamp + Random Number + Safe Filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = getSafeFileName(file.originalname);
        
        cb(null, `${uniqueSuffix}-${safeName}`);
    }
});

// २. फाईल फिल्टर - फक्त आवश्यक फॉरमॅट्सना परवानगी
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Security Alert: ${ext} files are not allowed!`), false);
    }
};

// ३. Multer Instance तयार करणे
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // २५ MB ची मर्यादा (Indian Govt Forms साठी पुरेशी आहे)
        files: 20 // एकावेळी जास्तीत जास्त २० फाईल्स (Merge साठी)
    }
});

module.exports = upload;
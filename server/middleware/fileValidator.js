const path = require('path');

/**
 * PDF फाईल्ससाठी कडक व्हॅलिडेशन (Single File)
 */
exports.validatePDF = (req, res, next) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // १. एक्सटेंशन तपासणे
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return next();
    } else {
        return res.status(400).json({ success: false, message: 'Only PDF files are allowed!' });
    }
};

/**
 * मल्टिपल फाईल्ससाठी व्हॅलिडेशन (उदा. Merge किंवा Student Mode साठी)
 */
exports.validateMultipleFiles = (req, res, next) => {
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    // प्रत्येक फाईल तपासा
    for (const file of files) {
        const filetypes = /pdf|jpg|jpeg|png|docx/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (!extname) {
            return res.status(400).json({ 
                success: false, 
                message: `File ${file.originalname} has an invalid format!` 
            });
        }
    }

    next();
};

/**
 * फाईल साईज चेक (SaaS Plan नुसार)
 * फ्री युजर्सना ५ एमबी पेक्षा मोठी फाईल अपलोड करण्यापासून रोखण्यासाठी
 */
exports.checkFileSizeLimit = (req, res, next) => {
    const file = req.file;
    const user = req.user;
    
    // ५ एमबी (फ्री युजरसाठी)
    const FREE_LIMIT = 5 * 1024 * 1024; 

    if (file && user.plan_type === 'free' && file.size > FREE_LIMIT) {
        return res.status(403).json({
            success: false,
            message: 'File size too large for Free Plan. Please upgrade to Premium (limit 20MB).'
        });
    }

    next();
};
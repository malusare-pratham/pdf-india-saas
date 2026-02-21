const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, '../uploads');

// १. फाईल्स कुठे सेव्ह करायच्या ते ठरवणे (Storage Config)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // जर फोल्डर नसेल तर तयार करणे
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // फाईलचे नाव युनिक ठेवण्यासाठी Timestamp वापरणे
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// २. फाईल फिल्टर (Security) - फक्त ठराविक फाईल फॉरमॅट्सना परवानगी देणे
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/msword', // doc
        'image/jpeg', 
        'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type! Only PDF, Word, and Images (JPG/PNG) are allowed.'), false);
    }
};

// ३. मुख्य अपलोड मिडलवेअर (Configuration)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // जास्तीत जास्त २० MB पर्यंत फाईल अपलोडला परवानगी
    }
});

module.exports = upload;

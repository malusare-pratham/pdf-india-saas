const winston = require('winston');
const path = require('path');

// लॉग्स सेव्ह करण्यासाठी फॉरमॅट ठरवणे
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

/**
 * Winston Logger Configuration
 */
const logger = winston.createLogger({
    level: 'info', // किमान 'info' लेव्हलचे लॉग्स सेव्ह करा
    format: logFormat,
    defaultMeta: { service: 'pdf-india-service' },
    transports: [
        // १. सर्व Error लॉग्स 'error.log' मध्ये सेव्ह होतील
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error' 
        }),
        // २. सर्व प्रकारचे लॉग्स 'combined.log' मध्ये सेव्ह होतील
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log') 
        }),
    ],
});

// जर आपण डेव्हलपमेंट मोडमध्ये असू, तर लॉग्स कन्सोलवर पण दिसले पाहिजेत (रंगीत स्वरूपात)
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

module.exports = logger;
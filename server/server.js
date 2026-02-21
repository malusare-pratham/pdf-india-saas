const app = require('./app');
const logger = require('./utils/logger');
require('colors');

/**
 * १. गंभीर चुका (Uncaught Exceptions) हाताळणे
 * उदा. जेव्हा कोडमध्ये असा एखादा व्हेरिएबल वापरला जातो जो डिफाइन केलेला नाही.
 */
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`.red.bold);
    logger.error(`Uncaught Exception: ${err.message} | Stack: ${err.stack}`);
    console.log('Shutting down due to uncaught exception...'.red);
    process.exit(1);
});

// २. पोर्ट सेट करणे
const PORT = process.env.PORT || 5000;

// ३. सर्व्हर सुरू करणे
const server = app.listen(PORT, () => {
    const startMessage = `
    🚀 PDF India Smart Tools - Server Active
    ---------------------------------------
    📍 Status: Running in ${process.env.NODE_ENV}
    🔌 Port:   ${PORT}
    📅 Time:   ${new Date().toLocaleString()}
    ---------------------------------------
    `.cyan.bold;
    
    console.log(startMessage);
});

/**
 * ४. अनहँडल्ड रिजेक्शन्स (Unhandled Promise Rejections) हाताळणे
 * उदा. जर मोंगोडीबी कनेक्ट झाली नाही आणि आपण तो एरर पकडला नसेल.
 */
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red.bold);
    logger.error(`Unhandled Rejection: ${err.message}`);
    
    // सर्व्हर सुरक्षितपणे बंद करून प्रोसेस एक्झिट करणे
    server.close(() => {
        process.exit(1);
    });
});

/**
 * ५. टर्मिनेशन सिग्नल (SIGTERM)
 * क्लाउड सर्व्हर (उदा. Heroku/AWS) सर्व्हर बंद करताना हा सिग्नल पाठवतात.
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM RECEIVED. Shutting down gracefully...'.yellow);
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});
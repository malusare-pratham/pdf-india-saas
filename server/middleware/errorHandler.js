/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };

    error.message = err.message;

    // लॉगसाठी एरर प्रिंट करणे (फक्त डेव्हलपमेंट मोडमध्ये)
    console.error(`[Error] => ${err.stack}`.red);

    // 1. Mongoose Bad Object ID (उदा. चुकीचा युजर ID शोधणे)
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new Error(message);
        res.status(404);
    }

    // 2. Mongoose Duplicate Key (उदा. आधीच असलेल्या ईमेलने रजिस्टर करणे)
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new Error(message);
        res.status(400);
    }

    // 3. Mongoose Validation Error (उदा. पासवर्ड खूप छोटा असणे)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new Error(message);
        res.status(400);
    }

    // 4. JWT Errors (टोकन चुकीचे किंवा एक्स्पायर असणे)
    if (err.name === 'JsonWebTokenError') {
        error = new Error('Invalid token. Please log in again.');
        res.status(401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new Error('Your session has expired. Please log in again.');
        res.status(401);
    }

    // फायनल रिस्पॉन्स पाठवणे
    res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
        success: false,
        error: error.message || 'Server Error',
        // सिक्युरिटीसाठी 'stack' फक्त डेव्हलपमेंटमध्येच दाखवावा
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
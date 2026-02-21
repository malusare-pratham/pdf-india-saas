// १. आवश्यक पॅकेजेस इम्पोर्ट करणे
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

// २. कॉन्फिग आणि मिडलवेअर्स इम्पोर्ट करणे
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const initFileCleaner = require('./utils/fileCleaner');

// ३. रूट फाईल्स इम्पोर्ट करणे
const authRoutes = require('./routes/authRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const adminRoutes = require('./routes/adminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// ४. एन्व्हायरनमेंट व्हेरिएबल्स लोड करणे
dotenv.config();

// ५. डेटाबेस कनेक्शन जोडणे
connectDB();

// ६. एक्सप्रेस ॲप सुरू करणे
const app = express();
app.set('trust proxy', 1);

// ७. ग्लोबल मिडलवेअर्स (Global Middlewares)
app.use(express.json()); // JSON डेटा वाचण्यासाठी
app.use(cors()); // वेगवेगळ्या ओरिजिनवरून येणाऱ्या रिक्वेस्टसाठी

// डेव्हलपमेंटमध्ये लॉग्स दाखवण्यासाठी 'morgan'
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// सुरक्षिततेसाठी रेट लिमिटर लावणे
app.use('/api', apiLimiter);

// ८. स्टॅटिक फोल्डर सेट करणे (अपलोड केलेल्या फाईल्स पाहण्यासाठी)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ९. रूट्स जोडणे (Mount Routes)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pdf', pdfRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/payment', paymentRoutes);

// १०. होम रूट (Health Check)
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to PDF India Smart Tools API',
        version: '1.0.0'
    });
});

// ११. फाइल क्लिनर सर्व्हिस सुरू करणे (Automated Maintenance)
initFileCleaner();

// १२. एरर हँडलर मिडलवेअर (हे नेहमी रूट्सच्या नंतर असावे)
app.use(errorHandler);

module.exports = app;

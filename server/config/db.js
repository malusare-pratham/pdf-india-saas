const mongoose = require('mongoose');
const logger = require('../utils/logger'); // आपण बनवलेला लॉगर वापरणे

/**
 * MongoDB शी कनेक्शन प्रस्थापित करणारे फंक्शन
 */
const connectDB = async () => {
    try {
        // मोंगोज कनेक्शन - पर्यावरणातील (Environment) व्हेरिएबल वापरून
        const conn = await mongoose.connect(process.env.MONGO_URI);

        const successMsg = `MongoDB Connected: ${conn.connection.host}`;
        
        // कन्सोल आणि लॉगरमध्ये माहिती प्रिंट करणे
        console.log(successMsg.cyan.underline);
        logger.info(successMsg);

    } catch (error) {
        const errorMsg = `Error connecting to MongoDB: ${error.message}`;
        
        console.error(errorMsg.red.bold);
        logger.error(errorMsg);

        // जर डेटाबेस कनेक्ट झाला नाही, तर बॅकएंड चालू करण्यात अर्थ नाही
        // म्हणून प्रोसेस एक्झिट (Exit) करणे (Failure code: 1)
        process.exit(1);
    }
};

module.exports = connectDB;

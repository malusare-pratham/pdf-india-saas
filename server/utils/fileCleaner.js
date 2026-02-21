const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

/**
 * फाईल्स डिलीट करण्याचे लॉजिक
 * @param {Number} maxAgeInMinutes - किती मिनिटांपूर्वीच्या फाईल्स डिलीट करायच्या
 */
const cleanUploadsFolder = (maxAgeInMinutes = 60) => {
    const directory = path.join(__dirname, '../uploads');

    // फोल्डर अस्तित्वात आहे का ते तपासणे
    if (!fs.existsSync(directory)) return;

    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Error reading uploads folder:', err);
            return;
        }

        const now = Date.now();
        const expirationTime = maxAgeInMinutes * 60 * 1000;

        files.forEach((file) => {
            const filePath = path.join(directory, file);

            // फाईलची माहिती मिळवणे (उदा. कधी तयार झाली)
            fs.stat(filePath, (err, stats) => {
                if (err) return;

                // जर फाईल १ तासापेक्षा जुनी असेल तर डिलीट करणे
                if (now - stats.mtimeMs > expirationTime) {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error(`Failed to delete: ${file}`);
                        else console.log(`Successfully deleted old file: ${file}`);
                    });
                }
            });
        });
    });
};

/**
 * Cron Job: दर तासाला (Top of the hour) हे फंक्शन रन होईल
 */
const initFileCleaner = () => {
    // Cron schedule: '0 * * * *' म्हणजे प्रत्येक तासाच्या ० व्या मिनिटाला
    cron.schedule('0 * * * *', () => {
        console.log('Running automated file cleanup...');
        cleanUploadsFolder(60); // ६० मिनिटांपेक्षा जुन्या फाईल्स काढा
    });
    
    console.log('File Cleaner Service Initialized.');
};

module.exports = initFileCleaner;
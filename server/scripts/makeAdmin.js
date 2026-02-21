const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const email = process.argv[2];

if (!email) {
    console.error('Usage: node scripts/makeAdmin.js <email>');
    process.exit(1);
}

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { $set: { role: 'admin', is_deleted: false } },
            { returnDocument: 'after' }
        );

        if (!user) {
            console.error(`User not found: ${email}`);
            process.exit(1);
        }

        console.log(`Admin granted: ${user.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to grant admin role:', error.message);
        process.exit(1);
    }
};

run();

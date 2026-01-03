require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedUsers = [
    {
        name: 'Saif Ullah',
        email: 'saif@zevenz.com',
        password: 'saif123',
        status: 'ACTIVE'
    },
    {
        name: 'Founder One',
        email: 'founder1@zevenz.com',
        password: 'password123',
        status: 'ACTIVE'
    },
    {
        name: 'Founder Two',
        email: 'founder2@zevenz.com',
        password: 'password123',
        status: 'ACTIVE'
    },
    {
        name: 'Founder Three',
        email: 'founder3@zevenz.com',
        password: 'password123',
        status: 'OUT'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check and create users
        for (const userData of seedUsers) {
            const existingUser = await User.findOne({ email: userData.email });

            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`Created user: ${userData.email}`);
            } else {
                console.log(`User already exists: ${userData.email}`);
                // Optional: Update existing user if needed
                // existingUser.name = userData.name;
                // existingUser.status = userData.status;
                // await existingUser.save();
            }
        }

        console.log('Database seeded successfully!');
        console.log('\nCredentials for Saif:');
        console.log('Email: saif@zevenz.com');
        console.log('Password: saif123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();

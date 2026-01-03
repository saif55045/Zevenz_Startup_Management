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
        name: 'Faizan',
        email: 'faizan@zevenz.com',
        password: 'faizan123',
        status: 'ACTIVE'
    },
    {
        name: 'Ahtasham',
        email: 'ahtasham@zevenz.com',
        password: 'ahtasham123',
        status: 'ACTIVE'
    },
    {
        name: 'Hassan Raza',
        email: 'hassan@zevenz.com',
        password: 'hassan123',
        status: 'ACTIVE'
    },
    {
        name: 'Ibrahim',
        email: 'ibrahim@zevenz.com',
        password: 'ibrahim123',
        status: 'ACTIVE'
    },
    {
        name: 'Farhan Akhtar',
        email: 'farhan@zevenz.com',
        password: 'farhan123',
        status: 'ACTIVE'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create seed users
        for (const userData of seedUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`Created user: ${userData.email}`);
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

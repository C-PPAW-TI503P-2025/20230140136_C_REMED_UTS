require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        console.log('Testing MySQL connection...');
        console.log('Host:', process.env.DB_HOST);
        console.log('User:', process.env.DB_USER);
        console.log('Database:', process.env.DB_NAME);

        // First, connect without database to create it if needed
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('✓ Connected to MySQL server');

        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`✓ Database '${process.env.DB_NAME}' ready`);

        await connection.end();

        // Now test Sequelize connection
        const sequelize = require('./config/database');
        await sequelize.authenticate();
        console.log('✓ Sequelize connection successful');

        await sequelize.close();
        console.log('\n✅ All tests passed! You can now run: npm start');

    } catch (error) {
        console.error('\n❌ Connection failed:');
        console.error('Error:', error.message);
        console.error('\nPlease check:');
        console.error('1. MySQL server is running');
        console.error('2. DB_USER and DB_PASSWORD in .env are correct');
        console.error('3. MySQL is accessible on', process.env.DB_HOST);
    }
}

testConnection();

require('dotenv').config();
const mysql = require('mysql2/promise');

async function quickTest() {
    console.log('\n=== MySQL Connection Test ===\n');
    console.log('Config from .env:');
    console.log('  DB_HOST:', process.env.DB_HOST);
    console.log('  DB_PORT:', process.env.DB_PORT);
    console.log('  DB_USER:', process.env.DB_USER);
    console.log('  DB_NAME:', process.env.DB_NAME);
    console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '(set)' : '(empty)');
    console.log('');

    try {
        console.log('Connecting...');
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected!\n');

        const [tables] = await conn.query('SHOW TABLES');
        console.log(`Found ${tables.length} table(s):`);
        tables.forEach(t => console.log('  -', Object.values(t)[0]));

        await conn.end();

        if (tables.length === 0) {
            console.log('\n📋 Running migration to create tables...\n');
            const { syncDatabase } = require('./models');
            await syncDatabase();
            console.log('\n✅ Tables created! Run: npm start\n');
        } else {
            console.log('\n✅ Database ready! Run: npm start\n');
        }

    } catch (err) {
        console.log('\n❌ Failed!');
        console.log('Error Code:', err.code);
        console.log('Error Message:', err.message);
        console.log('\nFull error:', err);
        console.log('\n💡 Tips:');
        console.log('  - Make sure MySQL is running on port', process.env.DB_PORT);
        console.log('  - Check username/password');
        console.log('  - Verify database exists');
    }
}

quickTest();

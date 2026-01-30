require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTables() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('\n✅ Connected to MySQL!\n');

        const [tables] = await conn.query('SHOW TABLES');

        console.log(`Found ${tables.length} table(s) in database '${process.env.DB_NAME}':\n`);

        if (tables.length === 0) {
            console.log('  (No tables yet)\n');
            console.log('❌ Migration has NOT run yet.');
            console.log('\n💡 The server needs to run successfully to create tables.');
            console.log('   Make sure server.js is running without errors.\n');
        } else {
            tables.forEach(t => {
                const tableName = Object.values(t)[0];
                console.log(`  ✓ ${tableName}`);
            });

            console.log('\n✅ Migration SUCCESS! Tables are created.\n');

            // Check structure
            for (const t of tables) {
                const tableName = Object.values(t)[0];
                const [columns] = await conn.query(`DESCRIBE ${tableName}`);
                console.log(`\nTable: ${tableName}`);
                console.log('Columns:');
                columns.forEach(col => {
                    console.log(`  - ${col.Field} (${col.Type})`);
                });
            }
        }

        await conn.end();

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    }
}

checkTables();

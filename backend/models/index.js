const sequelize = require('../config/database');
const Book = require('./Book');
const BorrowLog = require('./BorrowLog');

// Define associations
Book.hasMany(BorrowLog, {
    foreignKey: 'bookId',
    as: 'borrowLogs'
});

BorrowLog.belongsTo(Book, {
    foreignKey: 'bookId',
    as: 'book'
});

// Sync database
const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connection established successfully.');

        await sequelize.sync({ alter: true });
        console.log('✓ Database synchronized successfully.');
    } catch (error) {
        console.error('✗ Unable to connect to the database:', error);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    Book,
    BorrowLog,
    syncDatabase
};

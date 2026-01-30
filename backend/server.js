require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./models');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Library System API',
        version: '1.0.0',
        endpoints: {
            books: '/api/books',
            borrow: '/api/borrow'
        }
    });
});

app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan'
    });
});

// Error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
    try {
        await syncDatabase();

        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('📚 Library System API Server');
            console.log('='.repeat(50));
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Base URL: http://localhost:${PORT}`);
            console.log(`📖 API Docs: http://localhost:${PORT}/`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { checkAdmin } = require('../middleware/roleCheck');

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Admin routes
router.post('/', checkAdmin, bookController.createBook);
router.put('/:id', checkAdmin, bookController.updateBook);
router.delete('/:id', checkAdmin, bookController.deleteBook);

module.exports = router;

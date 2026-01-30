const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { checkUser } = require('../middleware/roleCheck');

// User routes
router.post('/', checkUser, borrowController.borrowBook);

module.exports = router;

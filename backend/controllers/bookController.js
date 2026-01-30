const { Book } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Get all books (Public)
 */
const getAllBooks = async (req, res, next) => {
    try {
        const books = await Book.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            message: 'Berhasil mengambil data buku',
            data: books
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get book by ID (Public)
 */
const getBookById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const book = await Book.findByPk(id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Buku tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Berhasil mengambil detail buku',
            data: book
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new book (Admin only)
 */
const createBook = async (req, res, next) => {
    try {
        const { title, author, stock } = req.body;

        // Validation
        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Title tidak boleh kosong'
            });
        }

        if (!author || author.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Author tidak boleh kosong'
            });
        }

        const book = await Book.create({
            title: title.trim(),
            author: author.trim(),
            stock: stock || 0
        });

        res.status(201).json({
            success: true,
            message: 'Buku berhasil ditambahkan',
            data: book
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update book (Admin only)
 */
const updateBook = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, author, stock } = req.body;

        const book = await Book.findByPk(id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Buku tidak ditemukan'
            });
        }

        // Validation
        if (title !== undefined && title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Title tidak boleh kosong'
            });
        }

        if (author !== undefined && author.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Author tidak boleh kosong'
            });
        }

        await book.update({
            title: title ? title.trim() : book.title,
            author: author ? author.trim() : book.author,
            stock: stock !== undefined ? stock : book.stock
        });

        res.json({
            success: true,
            message: 'Buku berhasil diupdate',
            data: book
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete book (Admin only)
 */
const deleteBook = async (req, res, next) => {
    try {
        const { id } = req.params;

        const book = await Book.findByPk(id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Buku tidak ditemukan'
            });
        }

        await book.destroy();

        res.json({
            success: true,
            message: 'Buku berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook
};

const { Book, BorrowLog, sequelize } = require('../models');

/**
 * Borrow a book (User only)
 */
const borrowBook = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { bookId, latitude, longitude } = req.body;
        const userId = req.userId; // From middleware

        // Validation
        if (!bookId) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Book ID tidak boleh kosong'
            });
        }

        if (latitude === undefined || longitude === undefined) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Latitude dan longitude harus disertakan'
            });
        }

        // Validate latitude and longitude range
        if (latitude < -90 || latitude > 90) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Latitude harus antara -90 dan 90'
            });
        }

        if (longitude < -180 || longitude > 180) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Longitude harus antara -180 dan 180'
            });
        }

        // Check if book exists
        const book = await Book.findByPk(bookId, { transaction: t });

        if (!book) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Buku tidak ditemukan'
            });
        }

        // Check stock
        if (book.stock <= 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Stok buku habis'
            });
        }

        // Decrease stock
        await book.update(
            { stock: book.stock - 1 },
            { transaction: t }
        );

        // Create borrow log with geolocation
        const borrowLog = await BorrowLog.create({
            userId,
            bookId,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            borrowDate: new Date()
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Buku berhasil dipinjam',
            data: {
                borrowLog,
                book: {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    remainingStock: book.stock
                }
            }
        });
    } catch (error) {
        await t.rollback();
        next(error);
    }
};

module.exports = {
    borrowBook
};

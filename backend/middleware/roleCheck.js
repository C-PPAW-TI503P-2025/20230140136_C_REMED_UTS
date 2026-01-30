/**
 * Middleware to check user role from headers
 * Uses x-user-role header to simulate authentication
 */

const checkAdmin = (req, res, next) => {
    const userRole = req.headers['x-user-role'];

    if (!userRole) {
        return res.status(401).json({
            success: false,
            message: 'Header x-user-role tidak ditemukan'
        });
    }

    if (userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya admin yang dapat mengakses endpoint ini.'
        });
    }

    next();
};

const checkUser = (req, res, next) => {
    const userRole = req.headers['x-user-role'];
    const userId = req.headers['x-user-id'];

    if (!userRole) {
        return res.status(401).json({
            success: false,
            message: 'Header x-user-role tidak ditemukan'
        });
    }

    if (userRole !== 'user') {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya user yang dapat mengakses endpoint ini.'
        });
    }

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Header x-user-id tidak ditemukan'
        });
    }

    // Attach userId to request for use in controller
    req.userId = parseInt(userId);
    next();
};

module.exports = {
    checkAdmin,
    checkUser
};

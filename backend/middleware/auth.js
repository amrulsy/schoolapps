const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'R4h4s!a_SIAS_T0k3n_2026';

/**
 * Middleware untuk memvalidasi JWT Token pada rute Admin.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Akses ditolak. Token autentikasi tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak. Format token salah.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, username, role, nama, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Sesi habis (Token expired). Silakan login ulang.' });
        }
        return res.status(403).json({ error: 'Token tidak valid atau sudah rusak.' });
    }
}

module.exports = { authMiddleware };

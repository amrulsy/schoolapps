const jwt = require('jsonwebtoken');

/**
 * Middleware untuk memvalidasi JWT Token siswa.
 * Menggantikan pendekatan Base64 yang tidak aman.
 * Setelah divalidasi, req.studentId akan terisi.
 */
function studentAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token diperlukan' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.studentId = decoded.studentId;
        req.studentNisn = decoded.nisn;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Sesi siswa habis. Silakan login ulang.' });
        }
        return res.status(403).json({ error: 'Token siswa tidak valid.' });
    }
}

module.exports = { studentAuthMiddleware };

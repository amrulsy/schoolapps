/**
 * SIAS — Simple Auth Middleware
 * Validates admin requests. Uses a simple token check 
 * matching the existing dummy auth pattern in server.js.
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];

    // Match existing dummy-token pattern from login endpoint
    if (token === 'dummy-token') {
        req.user = { id: 1, nama: 'Pak Ahmad', role: 'admin' };
        return next();
    }

    return res.status(403).json({ error: 'Token tidak valid.' });
}

module.exports = { authMiddleware };

/**
 * SIAS — Simple Rate Limiter
 * In-memory rate limiting for public endpoints.
 */
const requests = new Map();

function rateLimiter(maxRequests = 30, windowMs = 60000) {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        if (!requests.has(ip)) {
            requests.set(ip, []);
        }

        const timestamps = requests.get(ip).filter(t => t > windowStart);
        requests.set(ip, timestamps);

        if (timestamps.length >= maxRequests) {
            return res.status(429).json({
                error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
            });
        }

        timestamps.push(now);
        next();
    };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
    const cutoff = Date.now() - 300000;
    for (const [ip, timestamps] of requests) {
        const filtered = timestamps.filter(t => t > cutoff);
        if (filtered.length === 0) requests.delete(ip);
        else requests.set(ip, filtered);
    }
}, 300000);

module.exports = { rateLimiter };

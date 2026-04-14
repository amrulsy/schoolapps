/**
 * HTTP Request Logger Middleware
 * Logs method, URL, and body (for POST/PUT) to console.
 */
function requestLogger(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (['POST', 'PUT'].includes(req.method)) {
        console.log('Body:', JSON.stringify(req.body));
    }
    next();
}

module.exports = { requestLogger };

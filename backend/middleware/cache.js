/**
 * SIAS — In-Memory Cache Middleware
 * Caches GET request responses for public endpoints.
 */
const cache = new Map();

function cacheMiddleware(ttlSeconds = 300) {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cached = cache.get(key);

        if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
            return res.json(cached.data);
        }

        const originalJson = res.json.bind(res);
        res.json = (data) => {
            cache.set(key, { data, timestamp: Date.now() });
            return originalJson(data);
        };
        next();
    };
}

function invalidateCache(pattern) {
    for (const key of cache.keys()) {
        if (key.includes(pattern)) cache.delete(key);
    }
}

function clearAllCache() {
    cache.clear();
}

module.exports = { cacheMiddleware, invalidateCache, clearAllCache };

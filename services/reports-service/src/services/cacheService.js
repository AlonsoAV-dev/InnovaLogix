import NodeCache from 'node-cache';

class CacheService {
    constructor(ttlSeconds = 300) { // Default TTL: 5 minutes
        this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false });
        console.log('🚀 [CacheService] Initialized with TTL:', ttlSeconds, 's');
    }

    get(key) {
        const value = this.cache.get(key);
        if (value) {
            console.log(`⚡ [Cache] HIT: ${key}`);
            return value;
        }
        console.log(`🐢 [Cache] MISS: ${key}`);
        return null;
    }

    set(key, value) {
        this.cache.set(key, value);
        console.log(`💾 [Cache] SET: ${key}`);
    }

    del(key) {
        this.cache.del(key);
        console.log(`🗑️ [Cache] DEL: ${key}`);
    }

    flush() {
        this.cache.flushAll();
        console.log('🧹 [Cache] FLUSHED');
    }

    /**
     * Middleware to cache GET requests
     * @param {number} durationSeconds - Custom TTL for this route
     */
    middleware(durationSeconds = 300) {
        return (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            const key = `__express__${req.originalUrl || req.url}`;
            const cachedBody = this.get(key);

            if (cachedBody) {
                return res.json(cachedBody);
            }

            // Override res.json to intercept and cache the response
            const originalSend = res.json;
            res.json = (body) => {
                this.set(key, body); // Use default TTL or implement custom logic if needed
                originalSend.call(res, body);
            };

            next();
        };
    }
}

export const cacheService = new CacheService();

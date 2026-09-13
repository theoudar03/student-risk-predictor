/**
 * Hybrid Caching Utility
 * Supports optional Redis (if REDIS_URL is configured) with automatic,
 * zero-downtime fallback to an In-Memory TTL Cache.
 */

class MemoryCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttlSeconds = 300) {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiresAt });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    del(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

// Global Memory Cache Instance
const memoryCache = new MemoryCache();

let redisClient = null;
let isRedisConnected = false;

// Attempt Redis connection if REDIS_URL is provided in environment
if (process.env.REDIS_URL) {
    try {
        const Redis = require('ioredis');
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            connectTimeout: 3000
        });

        redisClient.on('connect', () => {
            console.log('⚡ [CACHE] Connected to Redis Cloud Cache');
            isRedisConnected = true;
        });

        redisClient.on('error', (err) => {
            console.warn('⚠️ [CACHE] Redis Error (Using In-Memory Fallback):', err.message);
            isRedisConnected = false;
        });
    } catch (e) {
        console.log('ℹ️ [CACHE] ioredis module not loaded, using In-Memory Cache');
    }
}

const cacheService = {
    async get(key) {
        if (isRedisConnected && redisClient) {
            try {
                const data = await redisClient.get(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                // Fallback to memory
            }
        }
        return memoryCache.get(key);
    },

    async set(key, value, ttlSeconds = 300) {
        if (isRedisConnected && redisClient) {
            try {
                await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
                return;
            } catch (e) {
                // Fallback to memory
            }
        }
        memoryCache.set(key, value, ttlSeconds);
    },

    async del(key) {
        if (isRedisConnected && redisClient) {
            try {
                await redisClient.del(key);
            } catch (e) {}
        }
        memoryCache.del(key);
    },

    getCacheType() {
        return isRedisConnected ? 'redis' : 'in-memory';
    }
};

module.exports = cacheService;

const Redis = require('ioredis');

let redis = null;
let connected = false;

const memStore = new Map();
const memTimers = new Map();

function getClient() {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('REDIS_URL not set, using in-memory fallback');
    return null;
  }

  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    connected = true;
    console.log('Connected to Redis');
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
    connected = false;
  });

  redis.on('close', () => {
    connected = false;
  });

  return redis;
}

const MAX_TTL = 2147483647;

function memSet(key, value, ttlMs) {
  memStore.set(key, value);
  const existing = memTimers.get(key);
  if (existing) clearTimeout(existing);
  if (ttlMs > 0) {
    memTimers.set(key, setTimeout(() => {
      memStore.delete(key);
      memTimers.delete(key);
    }, Math.min(ttlMs, MAX_TTL)));
  }
}

function memGet(key) {
  return memStore.get(key) ?? null;
}

async function connect() {
  const client = getClient();
  if (!client) return false;
  try {
    await client.connect();
    connected = true;
    return true;
  } catch (err) {
    console.error('Redis connection failed:', err.message);
    return false;
  }
}

function isRedisAvailable() {
  return redis !== null && connected;
}

async function getGlobalState() {
  if (!isRedisAvailable()) return null;
  try {
    const data = await redis.get('global:state');
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

async function setGlobalState(state) {
  if (!isRedisAvailable()) return false;
  try {
    await redis.set('global:state', JSON.stringify(state), 'EX', 86400 * 30);
    return true;
  } catch (err) {
    return false;
  }
}

async function getGlobalDailyLimit() {
  if (isRedisAvailable()) {
    try {
      const data = await redis.get('global:daily');
      if (data !== null) return data;
    } catch (err) {}
  }
  return memGet('global:daily');
}

async function setGlobalDailyLimit(date) {
  if (isRedisAvailable()) {
    try {
      await redis.set('global:daily', date, 'EX', 86400 * 2);
      memSet('global:daily', date, 86400 * 2 * 1000);
      return true;
    } catch (err) {}
  }
  memSet('global:daily', date, 86400 * 2 * 1000);
  return true;
}

module.exports = { connect, getGlobalState, setGlobalState, getGlobalDailyLimit, setGlobalDailyLimit };

const Redis = require('ioredis');

let redis = null;
let connected = false;

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

async function getGlobalState() {
  const client = getClient();
  if (!client || !connected) return null;
  try {
    const data = await client.get('global:state');
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

async function setGlobalState(state) {
  const client = getClient();
  if (!client || !connected) return false;
  try {
    await client.set('global:state', JSON.stringify(state), 'EX', 86400 * 30);
    return true;
  } catch (err) {
    return false;
  }
}

async function getGlobalDailyLimit() {
  const client = getClient();
  if (!client || !connected) return null;
  try {
    return await client.get('global:daily');
  } catch (err) {
    return null;
  }
}

async function setGlobalDailyLimit(date) {
  const client = getClient();
  if (!client || !connected) return false;
  try {
    await client.set('global:daily', date, 'EX', 86400 * 2);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { connect, getGlobalState, setGlobalState, getGlobalDailyLimit, setGlobalDailyLimit };

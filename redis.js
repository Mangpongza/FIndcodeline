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

async function getUserState(userName) {
  const client = getClient();
  if (!client || !connected) return null;
  try {
    const key = `user:${userName}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get error:', err.message);
    return null;
  }
}

async function setUserState(userName, state) {
  const client = getClient();
  if (!client || !connected) return false;
  try {
    const key = `user:${userName}`;
    await client.set(key, JSON.stringify(state), 'EX', 86400 * 30);
    return true;
  } catch (err) {
    console.error('Redis set error:', err.message);
    return false;
  }
}

async function deleteUserState(userName) {
  const client = getClient();
  if (!client || !connected) return false;
  try {
    const key = `user:${userName}`;
    await client.del(key);
    return true;
  } catch (err) {
    console.error('Redis del error:', err.message);
    return false;
  }
}

async function getDailyLimit(userName) {
  const client = getClient();
  if (!client || !connected) return null;
  try {
    return await client.get(`daily:${userName}`);
  } catch (err) {
    return null;
  }
}

async function setDailyLimit(userName, date) {
  const client = getClient();
  if (!client || !connected) return false;
  try {
    await client.set(`daily:${userName}`, date, 'EX', 86400 * 2);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = { connect, getUserState, setUserState, deleteUserState, getDailyLimit, setDailyLimit };

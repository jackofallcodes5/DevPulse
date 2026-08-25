const IORedis = require('ioredis');
const config = require('./env');

let redisClient = null;

const createRedisClient = () => {
  const client = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  client.on('connect', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('Redis connected');
    }
  });

  client.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Redis connection error:', err.message);
    }
  });

  return client;
};

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

module.exports = { getRedisClient, createRedisClient };

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export async function initRedis() {
  const redisConfig: any = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  };
  if (process.env.REDIS_PASSWORD) {
    redisConfig.password = process.env.REDIS_PASSWORD;
  }

  redisClient = createClient(redisConfig);


  redisClient.on('connect', () => {
    console.log('📡 redis connecting...');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis ready!');
  });

  await redisClient.connect();
  return redisClient;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    console.log('👋 Redis disconnected');
  }
}
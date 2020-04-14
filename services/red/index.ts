import { Log } from 'utils';
const log = Log('redis');
const config = require('../../config.' + process.env.NODE_ENV);
export const projectKey = `cinemas:${process.env.NODE_ENV}`;

export const redisClient = require('redis').createClient(config.REDIS_URL, {
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
        return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 10 * 60 * 60) {
        return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
        return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// Sets

export const sadd = async (key: string, ...val: string[]) => (
  new Promise((resolve, reject) => (
    redisClient.sadd(key, val, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

export const smembers = async (key: string) => (
  new Promise<string[]>((resolve, reject) => (
    redisClient.smembers(key, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

export const srem = async (key: string, ...val: string[]) => (
  new Promise<number>((resolve, reject) => (
    redisClient.srem(key, val, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

export const sismember = async (key: string, val: string) => (
  new Promise<boolean>((resolve, reject) => (
    redisClient.sismember(key, val, (err, res) => (
      err ? reject(err) : resolve(res ? true : false)
    ))
  ))
);

export const sdiff = async (keyA: string, keyB: string) => (
  new Promise<string[]>((resolve, reject) => (
    redisClient.sdiff(keyA, keyB, (err, res) => (
      err ? reject(err) : resolve(res)
    ))
  ))
);

// Default err processor

redisClient.on('error', (err) => {
  log.err(err);
}).on('connect', () => {
  log.debug('Connected to Redis');
});

import redis from 'redis';
import { Log } from 'utils';
const log = Log('redis');
const { env: { REDIS_HOST, REDIS_PORT, REDIS_PASS, NODE_ENV } } = process;
export const projectKey = `cinemas:${NODE_ENV}`;
export const redisClient = redis.createClient({
    host: REDIS_HOST,
    password: REDIS_PASS,
    port: parseInt(REDIS_PORT, 10),
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
    },
});
// Sets
export const sadd = async (key, ...val) => (new Promise((resolve, reject) => (redisClient.sadd(key, val, (err, res) => (err ? reject(err) : resolve(res))))));
export const smembers = async (key) => (new Promise((resolve, reject) => (redisClient.smembers(key, (err, res) => (err ? reject(err) : resolve(res))))));
export const srem = async (key, ...val) => (new Promise((resolve, reject) => (redisClient.srem(key, val, (err, res) => (err ? reject(err) : resolve(res))))));
export const sismember = async (key, val) => (new Promise((resolve, reject) => (redisClient.sismember(key, val, (err, res) => (err ? reject(err) : resolve(res ? true : false))))));
export const sdiff = async (keyA, keyB) => (new Promise((resolve, reject) => (redisClient.sdiff(keyA, keyB, (err, res) => (err ? reject(err) : resolve(res))))));
// Default err processor
redisClient.on('error', (err) => {
    log.err(err);
});
//# sourceMappingURL=index.js.map
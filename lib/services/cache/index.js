import { isNumber } from 'lodash';
import { projectKey, redisClient } from 'services/redis';
import { Log } from 'utils';
const rootKey = `${projectKey}:cache`;
const log = Log('cache');
export const setCache = async (recKey, value, expire) => (new Promise((resolve, reject) => {
    const key = `${rootKey}:${recKey}`;
    let data = null;
    try {
        data = JSON.stringify(value);
    }
    catch (err) {
        log.err(`setting cache error: ${err.toString()}`);
        return reject(err);
    }
    if (expire && isNumber(expire)) {
        redisClient.set(key, data, 'EX', expire, (err) => (err ? reject(err) : resolve()));
    }
    else {
        redisClient.set(key, data, (err) => (err ? reject(err) : resolve()));
    }
}));
export const getCache = async (recKey) => (new Promise((resolve, reject) => {
    const key = `${rootKey}:${recKey}`;
    redisClient.get(key, (err, rawData) => {
        if (err) {
            log.err(`getting cache error: ${err.toString()}`);
            reject(err);
        }
        else {
            if (!rawData) {
                return resolve(null);
            }
            let data = null;
            try {
                data = JSON.parse(rawData);
            }
            catch (parsErr) {
                log.err(`parsing cache error: ${parsErr.toString()}`);
                return reject(parsErr);
            }
            resolve(data);
        }
    });
}));
//# sourceMappingURL=index.js.map
import { projectKey, sadd, sismember, smembers, srem } from 'services/redis';
import { Log } from 'utils';
const rootKey = `${projectKey}:admins`;
const { env: { ADMIN_TOKEN } } = process;
const log = Log('admin');
export const isAdmin = async (chatId) => (ADMIN_TOKEN ? sismember(rootKey, `${chatId}`) : false);
export const adminLogin = async (chatId, token) => {
    if (!ADMIN_TOKEN) {
        log.warn(`trying to login without ADMIN_TOKEN provided`);
        return false;
    }
    if (token !== ADMIN_TOKEN) {
        return false;
    }
    const added = await sadd(rootKey, `${chatId}`);
    return added ? true : false;
};
export const adminLogout = async (chatId) => (srem(rootKey, `${chatId}`));
export const getAdminChats = async () => (smembers(rootKey));
//# sourceMappingURL=admin.js.map
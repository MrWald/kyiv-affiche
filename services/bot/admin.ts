import { TGChatId } from '../../lib/tgbot';
import { projectKey, sadd, sismember, smembers, srem } from '../red';
import { Log } from '../../utils';
const rootKey = `${projectKey}:admins`;
const { env: { ADMIN_TOKEN } } = process;
const log = Log('admin');

export const isAdmin = async (chatId: TGChatId) => (
  ADMIN_TOKEN ? sismember(rootKey, `${chatId}`) : false
);

export const adminLogin = async (chatId: TGChatId, token: string): Promise<boolean> => {
  if (!ADMIN_TOKEN) {
    log.warn(`trying to login without ADMIN_TOKEN provided`);
    return false;
  }
  if (token !== ADMIN_TOKEN) { return false; }
  const added = await sadd(rootKey, `${chatId}`);
  return added ? true : false;
};

export const adminLogout = async (chatId: TGChatId) => (
  srem(rootKey, `${chatId}`)
);

export const getAdminChats = async (): Promise<string[]> => (
  smembers(rootKey)
);

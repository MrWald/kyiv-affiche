import { TGChatId } from '../../lib/tgbot';
import { projectKey, sadd, sdiff, smembers, srem  } from '../red';
const rootKey = `${projectKey}:chats`;

export const addToAllGroup = (chatId: TGChatId) => addToGroup(chatId, 'all');
export const removeFromAllGroup = (chatId: TGChatId) => removeFromGroup(chatId, 'all');
export const getAllGroup = () => getGroup('all');

export const addToGroup = async (chatId: TGChatId, group: string) => (
  sadd(`${rootKey}:${group}`, `${chatId}`)
);

export const removeFromGroup = async (chatId: TGChatId, group: string) => (
  srem(`${rootKey}:${group}`, `${chatId}`)
);

export const getGroup = async (group: string) => (
  smembers(`${rootKey}:${group}`)
);

export const getNotInGroup = async (group: string) => (
  sdiff(`${rootKey}:all`, `${rootKey}:${group}`)
);

import { projectKey, sadd, sdiff, smembers, srem } from 'services/redis';
const rootKey = `${projectKey}:chats`;
export const addToAllGroup = (chatId) => addToGroup(chatId, 'all');
export const removeFromAllGroup = (chatId) => removeFromGroup(chatId, 'all');
export const getAllGroup = () => getGroup('all');
export const addToGroup = async (chatId, group) => (sadd(`${rootKey}:${group}`, `${chatId}`));
export const removeFromGroup = async (chatId, group) => (srem(`${rootKey}:${group}`, `${chatId}`));
export const getGroup = async (group) => (smembers(`${rootKey}:${group}`));
export const getNotInGroup = async (group) => (sdiff(`${rootKey}:all`, `${rootKey}:${group}`));
//# sourceMappingURL=chatsStore.js.map
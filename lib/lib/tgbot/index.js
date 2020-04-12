import { asyncReq } from 'utils';
const asyncReqData = async (opt) => {
    const { response, data: body } = await asyncReq(opt);
    const { statusCode } = response;
    if ((statusCode < 200) || (statusCode > 299)) {
        throw new Error(`Wrong status code: ${statusCode}, body: ${body}`);
    }
    if (body.ok === true) {
        return body.result;
    }
    if (body.ok === false) {
        throw new Error(body.description);
    }
    else {
        throw new Error(`Unknow error: ${body.toString ? body.toString() : body}`);
    }
};
export const strFromBotCmd = (text) => {
    const regex = /\/[\w\d_-]+ ([\w\d_-]+)/g;
    const match = regex.exec(text);
    return match ? match[1] : null;
};
export default class TelegramBot {
    constructor(token) {
        this.token = token;
    }
    static strFromCmd(text) {
        const regex = /\/[\w\d_-]+ ([\w\d_-]+)/g;
        const match = regex.exec(text);
        return match ? match[1] : null;
    }
    async getMe() {
        return this.apiReq({ method: 'getMe' });
    }
    async sendTextMessage(chat_id, text, opt) {
        if (!chat_id) {
            throw new Error('chat_id required');
        }
        const data = opt ? Object.assign({ chat_id, text }, opt) : { chat_id, text };
        return this.sendMessage(data);
    }
    async sendMessage(data) {
        return this.apiReq({ method: 'sendMessage', data });
    }
    async apiReq({ method, data }) {
        const url = `https://api.telegram.org/bot${this.token}/${method}`;
        if (!data) {
            return asyncReqData({ method: 'GET', url, json: true });
        }
        const headers = {
            'Content-Type': 'application/json',
        };
        return asyncReqData({ method: 'POST', url, headers, json: data });
    }
}
//# sourceMappingURL=index.js.map
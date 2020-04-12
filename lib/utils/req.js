import request from 'request';
export const asyncReq = (opt) => (new Promise((resolve, reject) => {
    request(opt, (err, res, body) => {
        if (err) {
            reject({ name: 'HTTP_REQ_ERR', descr: err.toString() });
        }
        else {
            if (res.statusCode > 299) {
                const name = 'HTTP_WRONG_STATUS_CODE';
                const descr = res.statusCode + (body ? ': ' + body : '');
                reject({ code: res.statusCode, name, descr });
            }
            else {
                resolve({ data: body, response: res });
            }
        }
    });
}));
//# sourceMappingURL=req.js.map
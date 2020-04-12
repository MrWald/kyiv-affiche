export const okResp = (body = 'ok', headers = {}) => ({
    body: JSON.stringify(body),
    headers,
    isBase64Encoded: false,
    statusCode: 200,
});
export const serverErrResp = (body) => ({
    body: JSON.stringify(body),
    headers: {},
    isBase64Encoded: false,
    statusCode: 503,
});
//# sourceMappingURL=lambda.js.map
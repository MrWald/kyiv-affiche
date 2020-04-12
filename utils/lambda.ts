export const okResp = (body: any = 'ok', headers: any = {}) => ({
  body: JSON.stringify(body),
  headers,
  isBase64Encoded: false,
  statusCode: 200,
});

export const serverErrResp = (body: any) => ({
  body: JSON.stringify(body),
  headers: {},
  isBase64Encoded: false,
  statusCode: 503,
});

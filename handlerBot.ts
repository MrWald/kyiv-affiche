import { APIGatewayProxyHandler } from 'aws-lambda';
import Bot from './services/bot';
import { Log, okResp } from './utils';
const log = Log('cinemas.handler');
const config = require(__dirname + '/config.' + process.env.NODE_ENV);

const BOT_TOKEN = config.BOT_TOKEN;
if (!BOT_TOKEN) {
  log.err('BOT_TOKEN not defined');
  process.exit(1);
}

const cacheEnabled = (config.CACHE_ENABLED === "false") || (config.CACHE_ENABLED === "0") ? false : true;
log.debug(cacheEnabled ? 'cache enabled' : 'cache disabled');
const bot = new Bot(BOT_TOKEN, cacheEnabled);

export const handler: APIGatewayProxyHandler = async (event, _context) => {
  log.debug(event);
  const { httpMethod, body } = event;
  if ((httpMethod === 'POST') && body) {
    log.debug('POST request');
    const data = JSON.parse(body);
    await bot.processUpdate(data);
  }
  if (httpMethod === 'GET') {
    log.debug('GET request, ignoring');
  }
  if ((event as any).action === 'checkForNew') {
    log.info('checkForNew action');
    await bot.onCheckForNewMovies();
  }
  return okResp();
};

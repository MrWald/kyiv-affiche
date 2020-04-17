import TelegramBot, {
  ITGMessage, ITGSendMessageReducedOpt, ITGUpdate, strFromBotCmd, TGChatId,
} from 'lib/tgbot';
import { isArray } from 'lodash';
import { getCache, setCache } from 'services/cache';
import { Log } from 'utils';
import { adminLogin, adminLogout, isAdmin } from 'services/bot/admin';
import { addToAllGroup, addToGroup, getNotInGroup, removeFromGroup } from 'services/bot/chatsStore';
import { getTheatresData, theatresDataToListMsg, getAllPerformances, getActors, getPhotos, getInfo, getAuthorsByName } from 'services/bot/theatres';
import { addToNotifiedMovies, filterNotNotifiedMovies } from 'services/bot/moviesStore';
import {
  cmdParamErr, helpMsg, loginedMsg, logoutErrMsg, logoutMsg,
  serviceErrMsg, sorryMsg, startMsg, subscribeMsg, unsubscribeMsg, helpAdminMsg
} from 'services/bot/msg';
import { EStatsEvent, logEvent, statsMsgForPeriod } from 'services/bot/stats';
const log = Log('theatres.bot');

const ScheduleCacheKey = 'schedule';
const ScheduleCacheExp = 60 * 60;
const UnsubscribeGroup = 'unsubscribe';

const clearMsg = (rawMsg?: string) => {
  if (!rawMsg) { return ''; }
  const msg = rawMsg.trim();
  return msg;
};

export default class CinemaBot {
  private cacheEnabled: boolean;
  private tgbot: TelegramBot;

  constructor(token: string, cacheEnabled: boolean = true) {
    this.cacheEnabled = cacheEnabled;
    this.tgbot = new TelegramBot(token);
  }

  public async processUpdate(data: ITGUpdate) {
    log.debug('processing update: ', data);
    if (data.message) {
      await this.processTextMsg(data.message);
    }
  }

  public async processTextMsg(message: ITGMessage) {
    log.debug('message received: ', message);
    const chatId = message.chat.id;
    const text = clearMsg(message.text);

    log.debug(`(${chatId}) ${text}`);
    addToAllGroup(chatId);
    try {
      if (text.indexOf('/start') === 0) {
        await this.onStartCmd(chatId, text);
        logEvent(EStatsEvent.Start);
      } else if (text.indexOf('/help') === 0) {
        await this.onHelpCmd(chatId);
        logEvent(EStatsEvent.Help);
      } else if (text.indexOf('/schedule') === 0) {
        await this.onScheduleCmd(chatId, text);
        logEvent(EStatsEvent.Schedule);
      } else if (text.indexOf('/theatres') === 0) {
        await this.onTheatresCmd(chatId);
        logEvent(EStatsEvent.Theatres);
      } else if (text.indexOf('/actors') === 0) {
        await this.onActorsCmd(chatId, text);
        logEvent(EStatsEvent.Actors);
      } else if (text.indexOf('/subscribe') === 0) {
        await this.onSubscribeCmd(chatId);
        logEvent(EStatsEvent.Subscribe);
      } else if (text.indexOf('/unsubscribe') === 0) {
        await this.onUnsubscribeCmd(chatId);
        logEvent(EStatsEvent.Unsubscribe);
      } else if (text.indexOf('/notify') === 0) {
        await this.onNotifyCmd(chatId, text);
      } else if (text.indexOf('/stats') === 0) {
        await this.onStatsCmd(chatId, text);
      } else if (text.indexOf('/logout') === 0) {
        await this.onLogoutCmd(chatId);
      } else if (text.indexOf('/photos') === 0) {
        await this.onPhotosCmd(chatId, text);
        logEvent(EStatsEvent.Photos);
      } else if (text.indexOf('/info') === 0) {
        await this.onInfoCmd(chatId, text);
        logEvent(EStatsEvent.Info);
      } else if (text.indexOf('/authors') === 0) {
        await this.onAuthorsCmd(chatId, text);
        logEvent(EStatsEvent.Authors);
      } else {
        await this.sendMsg(chatId, sorryMsg);
      }
    } catch (err) {
      log.err('process text msg err, err=', err);
      await this.sendMsg(chatId, serviceErrMsg);
    }
  }

  public async onStartCmd(chatId: TGChatId, text: string) {
    if (text === '/start') {
      await this.sendMsg(chatId, startMsg);
    } else {
      const regex = /\/start ([\w\d_-]+)/g;
      const match = regex.exec(text);
      if (!match) { return this.sendMsg(chatId, startMsg); }
      const accessToken = match[1];
      const isLogined = await adminLogin(chatId, accessToken);
      if (!isLogined) {
        await this.sendMsg(chatId, startMsg);
      } else {
        await this.sendMsg(chatId, loginedMsg);
      }
    }
  }

  public async onStatsCmd(chatId: TGChatId, text: string) {
    if (!await isAdmin(chatId)) { return this.sendMsg(chatId, sorryMsg); }
    const period = strFromBotCmd(text) || 'week';
    if (['day', 'week', 'month', 'year'].indexOf(period) === -1) {
      return this.sendMsg(chatId, cmdParamErr);
    }
    const msg = await statsMsgForPeriod(period);
    await this.sendMsg(chatId, msg, { parse_mode: 'Markdown' });
  }

  public async onLogoutCmd(chatId: TGChatId) {
    if (!await isAdmin(chatId)) { return this.sendMsg(chatId, sorryMsg); }
    const isLogouted = await adminLogout(chatId);
    if (!isLogouted) { return this.sendMsg(chatId, logoutErrMsg); }
    await this.sendMsg(chatId, logoutMsg);
  }

  public async onHelpCmd(chatId: TGChatId) {
    await isAdmin(chatId) ? await this.sendMsg(chatId, helpAdminMsg, {disable_web_page_preview: true}) : await this.sendMsg(chatId, helpMsg, {disable_web_page_preview: true});
  }

  public async onScheduleCmd(chatId: TGChatId, text: string) {
    let cinemasData;
    if(text === '/schedule') {
      cinemasData = await getAllPerformances();
      let response = "";
      for(const performance of cinemasData){
        response += 
          `${performance.name}:\n`+
          `\tЖанр: ${performance.genre}\n`+
          `\tДе: ${performance.theatres.join(", ")}\n`+
          `\tВік: ${performance.max_age}+\n`+
          `\tЦіни: ${performance.max_price} - ${performance.min_price} грн\n`+
          `\tКоли: ${performance.dates.join(", ")}\n\n`;
      }
      await this.sendMsg(chatId, response, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
    else {
      const theatre = text.substr(text.indexOf(' ')+1);
      cinemasData = await this.getCachedCinemasData(theatre);
      log.trace(cinemasData);
      if(cinemasData.length===0)
        await this.sendMsg(chatId, "Не вдалось знайти театр з такою назвою. Перевірте правильність введеної назви", { parse_mode: 'Markdown', disable_web_page_preview: true });
      else{
        let performancePart = "";
        if(cinemasData[0].performances.length===0)
          performancePart = "\tПусто";
        else{
          for(const performance of cinemasData[0].performances){
            performancePart += 
              `\t${performance.name}:\n`+
              `\t\tВік: ${performance.max_age}\n`+
              `\t\tЦіни: ${performance.max_price} - ${performance.min_price} грн\n`+
              `\t\tКоли: ${performance.dates.join(", ")}\n\n`;
          }
        }
        const cinemasMsg = `${cinemasData[0].name}:\n${performancePart}`;
        await this.sendMsg(chatId, cinemasMsg, { parse_mode: 'Markdown', disable_web_page_preview: true });
      }
    }
  }

  public async onPhotosCmd(chatId: TGChatId, text: string) {
    const cinemasData = await getPhotos(text.substr(text.indexOf(' ')+1));
    log.trace(cinemasData);
    if(cinemasData.length === 0)
      await this.sendMsg(chatId, "Не вдалось знайти фото. Перевірте правильність введених даних.", { parse_mode: 'Markdown', disable_web_page_preview: false });
    else {
      const message = [];
      for(const url of cinemasData){
        message.push({
          type: "photo",
          media: url,
        });
      }
      await this.sendPhoto(chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: false });
    }
  }

  public async onInfoCmd(chatId: TGChatId, text: string) {
    const cinemasData = await getInfo(text.substr(text.indexOf(' ')+1));
    if(cinemasData === "")
      await this.sendMsg(chatId, "Не вдалось знайти інформацію. Перевірте правильність введених даних.", { parse_mode: 'Markdown', disable_web_page_preview: false });
    else {
      log.trace(cinemasData);
      await this.sendMsg(chatId, cinemasData, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
  }

  public async onTheatresCmd(chatId: TGChatId) {
    const cinemasData = await this.getCachedCinemasData(null);
    log.trace(cinemasData);
    const cinemasMsg = theatresDataToListMsg(cinemasData);
    await this.sendMsg(chatId, cinemasMsg, { parse_mode: 'Markdown', disable_web_page_preview: true });
  }

  public async onAuthorsCmd(chatId: TGChatId, text: string) {
    const actorsData = await getAuthorsByName(text.substr(text.indexOf(' ')+1));
    log.trace(actorsData);
    if(actorsData.length === 0)
      await this.sendMsg(chatId, "Відсутній перелік авторів. Перевірте правильність введених даних.", { parse_mode: 'Markdown', disable_web_page_preview: true });
    else {
      const cinemasMsg = actorsData.join("\n");
      await this.sendMsg(chatId, cinemasMsg, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
  }

  public async onActorsCmd(chatId: TGChatId, text: string) {
    const actorsData = await getActors(text.substr(text.indexOf(' ')+1));
    log.trace(actorsData);
    if(actorsData.length === 0)
      await this.sendMsg(chatId, "Відсутній перелік акторів. Перевірте правильність введених даних.", { parse_mode: 'Markdown', disable_web_page_preview: true });
    else {
      const cinemasMsg = actorsData.join("\n");
      await this.sendMsg(chatId, cinemasMsg, { parse_mode: 'Markdown', disable_web_page_preview: true });
    }
  }

  // Subscriptions

  public async onSubscribeCmd(chatId: TGChatId) {
    removeFromGroup(chatId, UnsubscribeGroup);
    await this.sendMsg(chatId, subscribeMsg);
  }

  public async onUnsubscribeCmd(chatId: TGChatId) {
    addToGroup(chatId, UnsubscribeGroup);
    await this.sendMsg(chatId, unsubscribeMsg);
  }

  public async onNotifyCmd(chatId: TGChatId, text: string) {
    if (!await isAdmin(chatId)) { return this.sendMsg(chatId, sorryMsg); }
    const msg = text.replace('/notify', '').trim();
    await this.notifySubscrUsersWithMsg(msg);
  }

  public async notifySubscrUsersWithMsg(msg: string) {
    const subscrChats = await getNotInGroup(UnsubscribeGroup);
    log.debug(`sending notification with text: "${msg}", users: ${subscrChats.length}`);
    for (const subscrChatId of subscrChats) {
      try {
        await this.sendMsg(subscrChatId, msg, {parse_mode: 'Markdown'});
      } catch (err) {
        log.err(err);
      }
    }
  }

  // New movies

  public async onCheckForNewMovies() {
    log.debug('checking for new plays');
    const cinemasData = await getAllPerformances();
    const movies = [];
    for(const performance of cinemasData){
      movies.push(performance.name);
    }
    const notNotifiedMovies = await filterNotNotifiedMovies(movies);
    if (notNotifiedMovies.length) {
      let msg = ``;
      for (const movie of notNotifiedMovies) {
        msg +=  !msg ? `"${movie}"` : `, "${movie}"`;
      }
      msg = `${msg} у театрі! Переглянути розклад: /schedule`;
      await this.notifySubscrUsersWithMsg(msg);
      await addToNotifiedMovies(notNotifiedMovies);
    } else {
      log.debug('new plays not found');
    }
  }

  // Bot

  public async sendMsg(chatId: TGChatId, msg: string, opt?: ITGSendMessageReducedOpt) {
    await this.tgbot.sendTextMessage(chatId, msg, opt);
  }

  public async sendPhoto(chatId: TGChatId, msg, opt?: ITGSendMessageReducedOpt) {
    await this.tgbot.sendPhotoMessage(chatId, msg, opt);
  }

  // Data

  public async getCachedCinemasData(theatreName: string) {
    if (!this.cacheEnabled) {
      log.debug(`cache disabled, loading theatres data from api`);
      return getTheatresData(theatreName);
    }
    const cachedData = await getCache(ScheduleCacheKey);
    if (cachedData && isArray(cachedData) && cachedData.length) {
      log.debug(`loading theatres data from cache`);
      if(!theatreName)
        return cachedData;
      else {
        for(const theatre of cachedData) {
          if(theatre.name === theatreName)
            return theatre;
        }
      }
    }
    log.debug(`loading theatres data from api`);
    const data = await getTheatresData(null);
    log.debug(`saving data to cache`);
    setCache(ScheduleCacheKey, data, ScheduleCacheExp);
    return data;
  }

}

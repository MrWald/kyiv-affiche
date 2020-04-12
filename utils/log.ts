import { isDate, isError, isNumber, isString, reduce } from 'lodash';

export enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2,
  Debug = 3,
  Trace = 4,
}

type LogEventName = 'log';

type LogEventHandlerRecord = (m: string, level: LogLevel, data: any[]) => void;

interface ILogEventHandlerRecord {
  name: string;
  handler: LogEventHandlerRecord;
}

const handlers: ILogEventHandlerRecord[] = [];

const emit = (name: LogEventName, mod: string, level: LogLevel, data: any[]) => {
  handlers.forEach((item) => {
    if (item.name === name) {
      item.handler(mod, level, data);
    }
  });
};

const on = (name: LogEventName, handler: LogEventHandlerRecord) => {
  handlers.push({ name, handler });
};

const levelToSymbol = (level: LogLevel) => {
  switch (level) {
  case LogLevel.Debug: return '-';
  case LogLevel.Info: return '+';
  case LogLevel.Warn: return '!';
  case LogLevel.Error: return 'x';
  case LogLevel.Trace: return '*';
  default: return '';
  }
};

const logDataItemToStr = (data: any): string => {
  if (data === undefined) { return 'undefined'; }
  if (data === null) { return 'null'; }
  if (isString(data)) { return data; }
  if (isNumber(data)) { return `${data}`; }
  if (isDate(data) || isError(data)) { return data.toString(); }
  if (!data) { return ''; }
  try {
    return JSON.stringify(data);
  } catch (err) {
    if (data.toString) { return data.toString(); }
    return '';
  }
};

const logDataArrToStr = (data: any[]): string => {
  if (!data.length) { return ''; }
  return reduce(data, (memo, item) => (
    memo ? `${memo} ${logDataItemToStr(item)}` : logDataItemToStr(item)
  ), '');
};

export const logToStr = (m: string, level: LogLevel, data: any[]): string => {
  const symbol = levelToSymbol(level);
  const str = logDataArrToStr(data);
  return `[${symbol}][${m}]: ${str}`;
};

const Log = (m: string) => {
  // tslint:disable:no-console
  const logWithLevel = (data: any[], level: LogLevel) => {
    emit('log', m, level, data);
    const symbol = levelToSymbol(level);
    const prefix = `[${symbol}][${m}]`;
    const dataStr = logDataArrToStr(data);
    switch (level) {
    case LogLevel.Debug:
      return console.log(`${prefix}:`, dataStr);
    case LogLevel.Info:
      return console.log(`${prefix}:`, dataStr);
    case LogLevel.Warn:
      return console.log(`${prefix}:`, dataStr);
    case LogLevel.Error:
      return console.error(`${prefix}:`, dataStr);
    case LogLevel.Trace:
      return console.log(`${prefix}:`, dataStr);
    default:
      return console.log(`${prefix}: `, dataStr);
    }
  };
  // tslint:enable:no-console

  const trace = (...data: any[]) => {
    logWithLevel(data, LogLevel.Trace);
  };

  const debug = (...data: any[]) => {
    logWithLevel(data, LogLevel.Debug);
  };

  const info = (...data: any[]) => {
    logWithLevel(data, LogLevel.Info);
  };

  const warn = (...data: any[]) => {
    logWithLevel(data, LogLevel.Warn);
  };

  const err = (...data: any[]) => {
    logWithLevel(data, LogLevel.Error);
  };

  const start = (tag: string) => {
    const symbol = levelToSymbol(LogLevel.Trace);
    // tslint:disable-next-line
    console.time(`[${symbol}][${m}]: ${tag}`);
  };

  const end = (tag: string) => {
    const symbol = levelToSymbol(LogLevel.Trace);
    // tslint:disable-next-line
    console.timeEnd(`[${symbol}][${m}]: ${tag}`);
  };

  return { trace, debug, info, warn, err, start, end, on };
};

export default Log;

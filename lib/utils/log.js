import { isDate, isError, isNumber, isString, reduce } from 'lodash';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Error"] = 0] = "Error";
    LogLevel[LogLevel["Warn"] = 1] = "Warn";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Debug"] = 3] = "Debug";
    LogLevel[LogLevel["Trace"] = 4] = "Trace";
})(LogLevel || (LogLevel = {}));
const handlers = [];
const emit = (name, mod, level, data) => {
    handlers.forEach((item) => {
        if (item.name === name) {
            item.handler(mod, level, data);
        }
    });
};
const on = (name, handler) => {
    handlers.push({ name, handler });
};
const levelToSymbol = (level) => {
    switch (level) {
        case LogLevel.Debug: return '-';
        case LogLevel.Info: return '+';
        case LogLevel.Warn: return '!';
        case LogLevel.Error: return 'x';
        case LogLevel.Trace: return '*';
        default: return '';
    }
};
const logDataItemToStr = (data) => {
    if (data === undefined) {
        return 'undefined';
    }
    if (data === null) {
        return 'null';
    }
    if (isString(data)) {
        return data;
    }
    if (isNumber(data)) {
        return `${data}`;
    }
    if (isDate(data) || isError(data)) {
        return data.toString();
    }
    if (!data) {
        return '';
    }
    try {
        return JSON.stringify(data);
    }
    catch (err) {
        if (data.toString) {
            return data.toString();
        }
        return '';
    }
};
const logDataArrToStr = (data) => {
    if (!data.length) {
        return '';
    }
    return reduce(data, (memo, item) => (memo ? `${memo} ${logDataItemToStr(item)}` : logDataItemToStr(item)), '');
};
export const logToStr = (m, level, data) => {
    const symbol = levelToSymbol(level);
    const str = logDataArrToStr(data);
    return `[${symbol}][${m}]: ${str}`;
};
const Log = (m) => {
    // tslint:disable:no-console
    const logWithLevel = (data, level) => {
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
    const trace = (...data) => {
        logWithLevel(data, LogLevel.Trace);
    };
    const debug = (...data) => {
        logWithLevel(data, LogLevel.Debug);
    };
    const info = (...data) => {
        logWithLevel(data, LogLevel.Info);
    };
    const warn = (...data) => {
        logWithLevel(data, LogLevel.Warn);
    };
    const err = (...data) => {
        logWithLevel(data, LogLevel.Error);
    };
    const start = (tag) => {
        const symbol = levelToSymbol(LogLevel.Trace);
        // tslint:disable-next-line
        console.time(`[${symbol}][${m}]: ${tag}`);
    };
    const end = (tag) => {
        const symbol = levelToSymbol(LogLevel.Trace);
        // tslint:disable-next-line
        console.timeEnd(`[${symbol}][${m}]: ${tag}`);
    };
    return { trace, debug, info, warn, err, start, end, on };
};
export default Log;
//# sourceMappingURL=log.js.map
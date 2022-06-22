type LogOptions = {
    err?: Error;
    extra?: any;
};

export const consoleLogger = {
    info: (message, logOptions: LogOptions = {}) => console.log(message, logOptions.extra),
    debug: (message, logOptions: LogOptions = {}) => console.debug(message, logOptions.extra),
    warn: (message, logOptions: LogOptions = {}) => console.warn(message, logOptions.err, logOptions.extra),
    error: (message, logOptions: LogOptions = {}) => console.error(message, logOptions.err, logOptions.extra),
};

export const emptyLogger = {
    info: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
};

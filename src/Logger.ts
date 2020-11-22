interface LoggerConfig {
    logErrorsAsWarnings: boolean;
}

export class Logger {
    private logger: any;
    private config: LoggerConfig;

    constructor(logger: any, config?: Partial<LoggerConfig>) {
        this.logger = logger;
        this.config = {logErrorsAsWarnings: false, ...config};
    }

    debug = (message, {extra}) => {
        try {
            this.logger.debug(message, {extra});
        } catch (_) {}
    };

    info = (message, {extra}) => {
        try {
            this.logger.info(message, {extra});
        } catch (_) {}
    };

    error = (message: string, err?: Error, extra?: any, logAsError?: boolean, logErrorAsInfo?: boolean) => {
        try {
            if (logErrorAsInfo) {
                this.logger.info(message, {err, extra});
                return;
            }
            if (logAsError) {
                this.logger.error(message, {err, extra});
                return;
            }
            if (this.config.logErrorsAsWarnings) {
                this.logger.warn(message, {err, extra});
                return;
            }
            this.logger.error(message, {err, extra});
        } catch (_) {}
    };
}

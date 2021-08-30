import {safe} from './utils';
import {MonitorOptions, MonitoredOptions, Unpromisify} from './types';
import {emptyLogger, consoleLogger} from './loggers';
import {Logger} from './Logger';
import {PluginsWrapper} from './plugins/PluginsWrapper';

interface Config {
    serviceName: string;
    shouldMonitorExecutionStart: boolean;
    disableSuccessLogs: boolean;
}

class Monitor {
    private plugins: PluginsWrapper;
    private config: Config;
    private logger: Logger;

    constructor(options: MonitorOptions) {
        this.plugins = new PluginsWrapper(options.plugins);

        this.config = {
            serviceName: options.serviceName ? `${options.serviceName}.` : '',
            shouldMonitorExecutionStart: options.shouldMonitorExecutionStart ?? true,
            disableSuccessLogs: options.logging?.disableSuccessLogs ?? false,
        };

        this.logger = new Logger(options.mock ? emptyLogger : options.logging?.logger ?? consoleLogger, {
            logErrorsAsWarnings: options.logging?.logErrorsAsWarnings,
        });
    }

    monitored<T>(scope: string, callable: () => T, options: MonitoredOptions<T> = {}) {
        const startTime = Date.now();

        if (this.config.shouldMonitorExecutionStart) {
            this.plugins.onStart({scope, options});
        }

        try {
            const result = callable();
            if (result && result instanceof Promise) {
                return result
                    .then((promiseResult: Unpromisify<T>) => this.onResult(promiseResult, scope, startTime, options))
                    .catch((err) => this.onError(err, scope, startTime, options));
            }
            return this.onResult(result as Unpromisify<T>, scope, startTime, options);
        } catch (err) {
            this.onError(err, scope, startTime, options);
        }
    }

    // TODO: keep logger or remove it
    monitoredLogger = (level: MonitoredOptions<any>['level'], message, {extra}) => {
        const log = level === 'info' ? this.logger.info : this.logger.debug;
        log(message, {extra});
    };

    private onResult<T>(
        result: Unpromisify<T>,
        scope: string,
        startTime: number,
        options: MonitoredOptions<T>
    ): Unpromisify<T> {
        const {shouldMonitorSuccess, context, parseResult, logResult, level} = options;
        const executionTime = Date.now() - startTime;

        if (shouldMonitorSuccess?.(result) ?? true) {
            this.plugins.onSuccess({scope, executionTime, options});
        }

        if (!this.config.disableSuccessLogs) {
            this.monitoredLogger(level, `${scope}.success`, {
                extra: {
                    ...context,
                    executionTime,
                    executionResult: logResult ? safe(parseResult)(result) : 'NOT_LOGGED',
                },
            });
        }

        return result;
    }

    private onError(err: any, scope: string, startTime: number, options: MonitoredOptions<never>): never {
        const executionTime = Date.now() - startTime;

        if (options?.shouldMonitorError?.(err) ?? true) {
            this.plugins.onFailure({scope, executionTime, options, reason: err});
        }

        throw err;
    }
}

export default Monitor;

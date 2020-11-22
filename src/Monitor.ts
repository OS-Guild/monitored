import {safe} from './utils';
import {MonitorOptions, MonitoredOptions, Unpromisify} from './types';
import {emptyLogger, consoleLogger} from './loggers';
import parseError from './parseError';
import {AsyncStatsD} from './AsyncStatsD';
import {Logger} from './Logger';

interface Config {
    serviceName: string;
    shouldMonitorExecutionStart: boolean;
    disableSuccessLogs: boolean;
}

class Monitor {
    private statsdClient: AsyncStatsD | undefined;
    private config: Config;
    private logger: Logger;
    private defaultParseError: (e: any) => any;

    constructor(options: MonitorOptions) {
        this.config = {
            serviceName: options.serviceName ? options.serviceName + '.' : '',
            shouldMonitorExecutionStart: options.shouldMonitorExecutionStart ?? true,
            disableSuccessLogs: options.logging?.disableSuccessLogs ?? false,
        };

        this.logger = new Logger(options.mock ? emptyLogger : options.logging?.logger ?? consoleLogger, {
            logErrorsAsWarnings: options.logging?.logErrorsAsWarnings,
        });
        this.defaultParseError = options.logging?.defaultParseError ?? parseError;

        if (options.statsd) {
            const {apiKey, root, ...restStatsdOptions} = options.statsd;
            const prefixesArray = [apiKey, root];
            if (options.serviceName) {
                prefixesArray.push(options.serviceName);
            }
            const prefix = prefixesArray.join('.') + '.';

            this.statsdClient = new AsyncStatsD(this.logger, {
                port: 8125,
                prefix,
                mock: options.mock,
                ...restStatsdOptions,
            });
        }
    }

    monitored = <T>(name: string, callable: () => T, options: MonitoredOptions<T> = {}) => {
        const {level = 'debug', context} = options;
        const startTime = Date.now();

        if (this.config.shouldMonitorExecutionStart) {
            this.increment(`${name}.start`);
            this.monitoredLogger(level, `${name}.start`, {extra: context});
        }

        try {
            const result = callable();
            if (result && result instanceof Promise) {
                return <T>(
                    (<any>(
                        result
                            .then((promiseResult: Unpromisify<T>) =>
                                this.onResult(promiseResult, name, startTime, options)
                            )
                            .catch(err => this.onErrorAsync(err, name, options))
                    ))
                );
            }
            return this.onResult(result as Unpromisify<T>, name, startTime, options);
        } catch (err) {
            return this.onErrorSync(err, name, options);
        }
    };

    getStatsdClient = () => this.statsdClient;

    increment: AsyncStatsD['increment'] = async (...args) => this.statsdClient?.increment(...args);

    gauge: AsyncStatsD['gauge'] = async (...args) => this.statsdClient?.gauge(...args);

    timing: AsyncStatsD['timing'] = async (...args) => this.statsdClient?.timing(...args);

    flush: AsyncStatsD['flush'] = async (...args) => this.statsdClient?.flush(...args) ?? true;

    monitoredLogger = (level: MonitoredOptions<any>['level'], message, {extra}) => {
        const log = level === 'info' ? this.logger.info : this.logger.debug;
        log(message, {extra});
    };

    private onResult = <T>(
        result: Unpromisify<T>,
        name: string,
        startTime: number,
        {shouldMonitorSuccess, context, parseResult, logResult, level}: MonitoredOptions<T>
    ): Unpromisify<T> => {
        const executionTime = Date.now() - startTime;

        if (shouldMonitorSuccess?.(result) ?? true) {
            this.increment(`${name}.success`);
            this.gauge(`${name}.ExecutionTime`, executionTime);
            this.timing(`${name}.ExecutionTime`, executionTime);
        }

        if (!this.config.disableSuccessLogs) {
            this.monitoredLogger(level, `${name}.success`, {
                extra: {
                    ...context,
                    executionTime,
                    executionResult: logResult ? safe(parseResult)(result) : 'NOT_LOGGED',
                },
            });
        }

        return result;
    };

    private onErrorAsync = async (
        err,
        name: string,
        {shouldMonitorError, context, logAsError, logErrorAsInfo, parseError}: MonitoredOptions<never>
    ) => {
        if (shouldMonitorError && !shouldMonitorError(err)) throw err;
        this.increment(`${name}.error`);
        this.logger.error(
            `${name}.error`,
            await safe(parseError || this.defaultParseError)(err),
            context,
            logAsError,
            logErrorAsInfo
        );
        throw err;
    };

    private onErrorSync = (
        err,
        name: string,
        {shouldMonitorError, context, logAsError, logErrorAsInfo, parseError}: MonitoredOptions<never>
    ) => {
        if (shouldMonitorError && shouldMonitorError(err)) throw err;
        this.increment(`${name}.error`);
        this.logger.error(
            `${name}.error`,
            safe(parseError || this.defaultParseError)(err),
            context,
            logAsError,
            logErrorAsInfo
        );
        throw err;
    };
}

export default Monitor;

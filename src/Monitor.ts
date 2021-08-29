import {safe} from './utils';
import {MonitorOptions, MonitoredOptions, Unpromisify} from './types';
import {emptyLogger, consoleLogger} from './loggers';
import {Logger} from './Logger';
import IMetricsProviderClient from './metricsProviderClient/IMetricsProvider';

interface Config {
    serviceName: string;
    shouldMonitorExecutionStart: boolean;
    disableSuccessLogs: boolean;
}

class Monitor {
    private metricsProviderClient: IMetricsProviderClient | undefined;
    private config: Config;
    private logger: Logger;

    constructor(options: MonitorOptions) {
        this.config = {
            serviceName: options.serviceName ? `${options.serviceName}.` : '',
            shouldMonitorExecutionStart: options.shouldMonitorExecutionStart ?? true,
            disableSuccessLogs: options.logging?.disableSuccessLogs ?? false,
        };

        this.logger = new Logger(options.mock ? emptyLogger : options.logging?.logger ?? consoleLogger, {
            logErrorsAsWarnings: options.logging?.logErrorsAsWarnings,
        });

        if (options.statsd) {
            const {apiKey, root, port, ...restStatsdOptions} = options.statsd;
            const prefixesArray = [apiKey, root, options.serviceName].filter(Boolean);
            const prefix = `${prefixesArray.join('.')}.`;

            // this.metricsProviderClient = new AsyncStatsD(this.logger, {
            //     port: port ?? 8125,
            //     prefix,
            //     mock: options.mock,
            //     ...restStatsdOptions,
            // });
        }
    }

    monitored = <T>(name: string, callable: () => T, options: MonitoredOptions<T> = {}) => {
        const {level = 'debug', context} = options;
        const startTime = Date.now();

        if (this.config.shouldMonitorExecutionStart) {
            this.metricsProviderClient?.onStart(name); // TODO: Support tags
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

    getMonitoringClient = () => this.metricsProviderClient;

    monitoredLogger = (level: MonitoredOptions<any>['level'], message, {extra}) => {
        const log = level === 'info' ? this.logger.info : this.logger.debug;
        log(message, {extra});
    };

    private onResult = <T>(
        result: Unpromisify<T>,
        name: string,
        startTime: number,
        {shouldMonitorSuccess, context, parseResult, logResult, level}: MonitoredOptions<T> // TODO: Support tags
    ): Unpromisify<T> => {
        const executionTime = Date.now() - startTime;

        if (shouldMonitorSuccess?.(result) ?? true) {
            this.metricsProviderClient?.onSuccess(name, executionTime)
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
        {shouldMonitorError, context, logAsError, logErrorAsInfo}: MonitoredOptions<never> // TODO: Support tags
    ) => {
        if (shouldMonitorError?.(err) ?? true) {
            // TODO: support exec time
            this.metricsProviderClient?.onFailure(name, 0)
            this.logger.error(
                `${name}.error`,
                err,
                context,
                logAsError,
                logErrorAsInfo
            );
        }
        
        throw err;
    };

    private onErrorSync = (
        err,
        name: string,
        {shouldMonitorError, context, logAsError, logErrorAsInfo}: MonitoredOptions<never> // TODO: Support tags
    ) => {
        if (shouldMonitorError?.(err) ?? true) {
            // TODO: support exec time
            this.metricsProviderClient?.onFailure(name, 0);
            this.logger.error(
                `${name}.error`,
                err,
                context,
                logAsError,
                logErrorAsInfo
            );
        }
        
        throw err;
    };
}

export default Monitor;

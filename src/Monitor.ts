import {MonitoredOptions, MonitorOptions} from './types';
import {PluginsWrapper} from './plugins/PluginsWrapper';
import {Logger} from './Logger';
import {consoleLogger, emptyLogger} from './loggers';
import {safe} from './utils';

interface Config {
    shouldMonitorExecutionStart: boolean;
    disableSuccessLogs: boolean;
}

class Monitor {
    private plugins: PluginsWrapper;
    private logger: Logger;
    private config: Config;

    constructor(options: MonitorOptions) {
        this.logger = new Logger(options.mock ? emptyLogger : options.logging?.logger ?? consoleLogger, {
            logErrorsAsWarnings: options.logging?.logErrorsAsWarnings,
        });

        this.plugins = new PluginsWrapper(options.plugins, {
            logger: this.logger,
        });

        this.config = {
            shouldMonitorExecutionStart: options.shouldMonitorExecutionStart ?? true,
            disableSuccessLogs: !!options.logging?.disableSuccessLogs,
        };
    }

    monitored<T>(scope: string, callable: () => T, options: MonitoredOptions<T> = {}): T {
        const {level = 'debug', context} = options;

        if (this.config.shouldMonitorExecutionStart) {
            this.plugins.onStart({scope, options});
            this.monitoredLogger(level, `${scope}.start`, {extra: context});
        }

        const startTime = Date.now();

        try {
            const result = callable();
            if (result && result instanceof Promise) {
                return result
                    .then((promiseResult: Awaited<T>) => this.onResult(promiseResult, scope, startTime, options))
                    .catch(err => this.onError(err, scope, startTime, options)) as unknown as T;
            }
            return this.onResult(result as Awaited<T>, scope, startTime, options) as T;
        } catch (err) {
            this.onError(err, scope, startTime, options);
        }
    }

    private onResult<T>(
        result: Awaited<T>,
        scope: string,
        startTime: number,
        options: MonitoredOptions<T>
    ): Awaited<T> {
        const {
            shouldMonitorSuccess,
            logResult,
            level = 'debug',
            context,
            parseResult,
            shouldMonitorResultFound,
        } = options;
        const executionTime = Date.now() - startTime;

        if (shouldMonitorSuccess?.(result) ?? true) {
            this.plugins.onSuccess({scope, executionTime, options});
        }

        if (shouldMonitorResultFound) {
            try {
                const isFound = shouldMonitorResultFound(result);
                this.plugins.reportResultIsFound({scope, options}, isFound);
            } catch {
                this.monitoredLogger('debug', 'isResultFound callback failed', {extra: {context}});
            }
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

            const {context, logAsError, logErrorAsInfo} = options;
            this.logger.error(`${scope}.error`, err, context, logAsError, logErrorAsInfo);
        }

        throw err;
    }

    monitoredLogger = (level: MonitoredOptions<any>['level'], message, {extra}) => {
        const log = level === 'info' ? this.logger.info : this.logger.debug;
        log(message, {extra});
    };

    /**
     * @deprecated since version 2.0
     */
    getStatsdClient = () => undefined;

    increment: PluginsWrapper['increment'] = async (...args) => await this.plugins?.increment(...args);

    gauge: PluginsWrapper['gauge'] = async (...args) => await this.plugins?.gauge(...args);

    timing: PluginsWrapper['timing'] = async (...args) => await this.plugins?.timing(...args);

    flush: PluginsWrapper['flush'] = async (...args) => (await this.plugins?.flush(...args)) ?? true;
}

export default Monitor;

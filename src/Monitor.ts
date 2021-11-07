import {MonitoredOptions, MonitorOptions, Unpromisify} from './types';
import {PluginsWrapper} from './plugins/PluginsWrapper';
import {Logger} from './Logger';
import {consoleLogger} from './loggers';

interface Config {
    serviceName: string;
    shouldMonitorExecutionStart: boolean;
}

class Monitor {
    private plugins: PluginsWrapper;
    private config: Config;
    private readonly logger: Logger;

    constructor(options: MonitorOptions) {
        this.plugins = new PluginsWrapper(options.plugins);

        this.config = {
            serviceName: options.serviceName ? `${options.serviceName}.` : '',
            shouldMonitorExecutionStart: options.shouldMonitorExecutionStart ?? true,
        };
        this.logger = options.logging?.logger ?? new Logger(consoleLogger);
    }

    monitored<T>(scope: string, callable: () => T, options: MonitoredOptions<T> = {}) {
        if (this.config.shouldMonitorExecutionStart) {
            this.plugins.onStart({scope, options, logger: this.logger});
        }

        const startTime = Date.now();

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

    private onResult<T>(
        result: Unpromisify<T>,
        scope: string,
        startTime: number,
        options: MonitoredOptions<T>
    ): Unpromisify<T> {
        const {shouldMonitorSuccess} = options;
        const executionTime = Date.now() - startTime;

        if (shouldMonitorSuccess?.(result) ?? true) {
            this.plugins.onSuccess({scope, executionTime, options, logger: this.logger});
        }

        return result;
    }

    private onError(err: any, scope: string, startTime: number, options: MonitoredOptions<never>): never {
        const executionTime = Date.now() - startTime;

        if (options?.shouldMonitorError?.(err) ?? true) {
            this.plugins.onFailure({scope, executionTime, options, reason: err, logger: this.logger});
        }

        throw err;
    }
}

export default Monitor;

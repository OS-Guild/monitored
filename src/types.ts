import {MetricOptions, MonitoredPlugin} from './plugins/types';

export interface MonitorOptions {
    serviceName: string;
    plugins: MonitoredPlugin[];
    logging?: {
        logger: any;
        logErrorsAsWarnings?: boolean;
        disableSuccessLogs?: boolean;
    };
    shouldMonitorExecutionStart?: boolean;
    mock?: boolean;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;

export interface MonitoredOptions<T> extends MetricOptions {
    logResult?: boolean;
    parseResult?: (r: Unpromisify<T>) => any;
    level?: 'info' | 'debug';
    logAsError?: boolean;
    logErrorAsInfo?: boolean;
    shouldMonitorError?: (e: any) => boolean;
    shouldMonitorSuccess?: (r: Unpromisify<T>) => boolean;
}

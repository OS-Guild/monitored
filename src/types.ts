import {MetricOptions, MonitoredPlugin} from './plugins/types';

export interface MonitorOptions {
    plugins: MonitoredPlugin[];
    logging?: {
        logger: any;
        logErrorsAsWarnings?: boolean;
        disableSuccessLogs?: boolean;
    };
    shouldMonitorExecutionStart?: boolean;
    mock?: boolean;
}

export interface MonitoredOptions<T> extends MetricOptions {
    level?: 'info' | 'debug';
    logResult?: boolean;
    parseResult?: (r: Awaited<T>) => any;
    shouldMonitorError?: (e: any) => boolean;
    logAsError?: boolean;
    logErrorAsInfo?: boolean;
    shouldMonitorSuccess?: (r: Awaited<T>) => boolean;
    shouldMonitorResultFound?: (r: Awaited<T>) => boolean;
}

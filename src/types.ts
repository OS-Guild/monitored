import {ClientOptions as StatsdClientOptions, Tags as StatsdTags} from 'hot-shots';

interface StatsdOptions extends Omit<StatsdClientOptions, 'prefix'> {
  apiKey: string;
  root: string;
  host: string;
  port?: number;
}

export type MonitorOptions = {
    serviceName: string;
    statsd?: StatsdOptions;
    logging?: {
        logger: any;
        logErrorsAsWarnings?: boolean;
        disableSuccessLogs?: boolean;
        defaultParseError?: (e: any) => any;
    };
    shouldMonitorExecutionStart?: boolean;
    mock?: boolean;
};

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T

export type MonitoredOptions<T> = {
  context?: any;
  logResult?: boolean;
  parseResult?: (r: Unpromisify<T>) => any;
  parseError?: (e: any) => any;
  level?: 'info' | 'debug';
  logAsError?: boolean;
  logErrorAsInfo?: boolean,
  shouldMonitorError?: (e: any) => boolean;
  shouldMonitorSuccess?: (r: Unpromisify<T>) => boolean;
  tags?: StatsdTags;
};

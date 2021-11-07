import {Logger} from '../Logger';

export interface MetricOptions {
    context?: Record<string, any>;
    tags?: Record<string, string>;
}

export interface CoreOptions {
    logger: Logger;
    scope: string;
    options?: MetricOptions;
}

export interface OnStartOptions extends CoreOptions {}

export interface OnSuccessOptions extends CoreOptions {
    executionTime: number;
}

export interface OnFailureOptions extends CoreOptions {
    executionTime: number;
    reason: any;
}

export interface MonitoredPlugin {
    onStart(opts: OnStartOptions): void;

    onSuccess(opts: OnSuccessOptions): void;

    onFailure(opts: OnFailureOptions): void;
}

import {Logger} from '../Logger';

export interface MetricOptions {
    context?: Record<string, any>;
    tags?: Record<string, string>;
}

export interface EventOptions {
    scope: string;
    options?: MetricOptions;
}

export interface InitializationOptions {
    logger: Logger;
}

export interface OnStartOptions extends EventOptions {}

export interface OnSuccessOptions extends EventOptions {
    executionTime: number;
}

export interface OnFailureOptions extends EventOptions {
    executionTime: number;
    reason: any;
}

export interface MonitoredPlugin {
    initialize?(opts: InitializationOptions): void;

    onStart(opts: OnStartOptions): void;

    onSuccess(opts: OnSuccessOptions): void;

    onFailure(opts: OnFailureOptions): void;

    increment<T extends string>(name: T, value?: number, tags?: Record<string, string>): Promise<void>;

    gauge(name: string, value?: number, tags?: Record<string, string>): Promise<void>;

    timing(name: string, value?: number, tags?: Record<string, string>): Promise<void>;

    flush(timeout: number): Promise<boolean>;
}

export interface MetricOptions {
    context?: Record<string, any>;
    tags?: Record<string, string>;
}

export interface OnStartOptions {
    scope: string;
    options?: MetricOptions;
}

export interface OnSuccessOptions {
    scope: string;
    executionTime: number;
    options?: MetricOptions;
}

export interface OnFailureOptions {
    scope: string;
    executionTime: number;
    options?: MetricOptions;
    reason: any;
}

export interface MonitoredPlugin {
    onStart(opts: OnStartOptions): void;
    onSuccess(opts: OnSuccessOptions): void;
    onFailure(opts: OnFailureOptions): void;
}

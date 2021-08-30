export interface MetricOptions {
    context?: Record<string, any>;
    tags?: Record<string, string | number>;
}

// export interface MetricOptions {
//     logging?: {
//         level?: 'info' | 'debug';
//         logAsError?: boolean;
//         logErrorAsInfo?: boolean;
//     };
// }

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
    onStart(opts: OnStartOptions): Promise<void>;
    onSuccess(opts: OnSuccessOptions): Promise<void>;
    onFailure(opts: OnFailureOptions): Promise<void>;
}

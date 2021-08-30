export interface MetricOptions {
    tags?: Record<string, string>;
}

export interface IMetricsProvider {
    onStart: (name: string, options?: MetricOptions) => Promise<void>;
    onSuccess: (name: string, executionTime: number, options?: MetricOptions) => Promise<void>;
    onFailure: (name: string, executionTime: number, options?: MetricOptions) => Promise<void>;
}

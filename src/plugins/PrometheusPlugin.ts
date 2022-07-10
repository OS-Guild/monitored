import {Counter, Histogram, register as registry, Gauge} from 'prom-client';
import {EventOptions, MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

export interface PrometheusPluginOptions {
    histogramBuckets?: number[];
}

export const DEFAULT_BUCKETS: readonly number[] = Object.freeze([10, 20, 50, 100, 150, 200, 300, 500, 1000]);

export class PrometheusPlugin implements MonitoredPlugin {
    private readonly histograms: Record<string, Histogram<string>> = {};
    private readonly counters: Record<string, Counter<string>> = {};
    private readonly gauges: Record<string, Gauge<string>> = {};

    constructor(private readonly opts: PrometheusPluginOptions = {}) {}

    onStart({scope, options}: OnStartOptions): void {
        const labels = {result: 'start', ...options?.tags};
        this.increment(scope, 1, labels);
    }

    onSuccess({scope, options, executionTime}: OnSuccessOptions): void {
        const labels = {result: 'success', ...options?.tags};
        this.increment(scope, 1, labels);
        this.timing(scope, executionTime, labels);
    }

    onFailure({scope, options, executionTime}: OnFailureOptions): void {
        const labels = {result: 'failure', ...options?.tags};
        this.increment(scope, 1, labels);
        this.timing(scope, executionTime, labels);
    }

    reportResultIsFound({scope, options}: EventOptions, isFound: boolean): void {
        const isFoundLabel = isFound ? 'found' : 'notFound';
        const labels = {result: isFoundLabel, ...options?.tags};
        this.increment(scope, 1, labels);
    }

    private getMetrics(scope: string) {
        if (!this.histograms[scope]) {
            this.histograms[scope] = new Histogram({
                name: `${scope}_execution_time`,
                help: `${scope}_execution_time`,
                buckets: this.opts.histogramBuckets ?? [...DEFAULT_BUCKETS],
                labelNames: ['result'],
            });
        }
        if (!this.counters[scope]) {
            this.counters[scope] = new Counter({
                name: `${scope}_count`,
                help: `${scope}_count`,
                labelNames: ['result'],
            });
        }
        if (!this.gauges[scope]) {
            this.gauges[scope] = new Gauge({
                name: `${scope}_gauge`,
                help: `${scope}_gauge`,
                labelNames: ['result'],
            });
        }

        return {histogram: this.histograms[scope], counter: this.counters[scope], gauge: this.gauges[scope]};
    }

    async metrics(): Promise<string> {
        return await registry.metrics();
    }

    async increment(name: string, value: number = 1, tags?: Record<string, string>): Promise<void> {
        this.getMetrics(name)
            .counter.labels(tags || {})
            .inc(value);
    }
    async gauge(name: string, value: number, tags?: Record<string, string>): Promise<void> {
        this.getMetrics(name)
            .gauge.labels(tags || {})
            .set(value);
    }

    async timing(name: string, value: number, tags?: Record<string, string>): Promise<void> {
        this.getMetrics(name)
            .histogram.labels(tags ?? {})
            .observe(value);
    }
    async flush(): Promise<boolean> {
        return true;
    }
}

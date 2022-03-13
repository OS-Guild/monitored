import {Counter, Histogram, register as registry, Gauge} from 'prom-client';
import {MetricOptions, MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

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
        const {counter} = this.getMetrics(scope, options);
        counter.inc({result: 'start', ...options?.tags});
    }

    onSuccess({scope, options, executionTime}: OnSuccessOptions): void {
        const {counter, histogram} = this.getMetrics(scope, options);
        const labels = {result: 'success', ...options?.tags};

        counter.inc(labels);
        histogram.observe(labels, executionTime);
    }

    onFailure({scope, options, executionTime}: OnFailureOptions): void {
        const {counter, histogram} = this.getMetrics(scope, options);
        const labels = {result: 'failure', ...options?.tags};

        counter.inc(labels);
        histogram.observe(labels, executionTime);
    }

    private getMetrics(scope: string, options?: MetricOptions) {
        if (!this.histograms[scope]) {
            this.histograms[scope] = new Histogram({
                name: `${scope}_execution_time`,
                help: `${scope}_execution_time`,
                buckets: this.opts.histogramBuckets ?? [...DEFAULT_BUCKETS],
                labelNames: ['result', ...Object.keys(options?.tags ?? {})],
            });
        }
        if (!this.counters[scope]) {
            this.counters[scope] = new Counter({
                name: `${scope}_count`,
                help: `${scope}_count`,
                labelNames: ['result', ...Object.keys(options?.tags ?? {})],
            });
        }
        if (!this.gauges[scope]) {
            this.gauges[scope] = new Gauge({
                name: `${scope}_gauge`,
                help: `${scope}_gauge`,
                labelNames: ['result', ...Object.keys(options?.tags ?? {})],
            });
        }

        return {histogram: this.histograms[scope], counter: this.counters[scope], gauge: this.gauges[scope]};
    }

    async metrics(): Promise<string> {
        return await registry.metrics();
    }

    async increment(name: string, value: number = 1, tags?: Record<string, string>): Promise<void> {
        const {counter} = this.getMetrics(name, {tags});
        let internal = counter.labels(tags || {});
        internal.inc(value);
    }
    async gauge(name: string, value: number, tags?: Record<string, string>): Promise<void> {
        const {gauge} = this.getMetrics(name, {tags});
        let internal = gauge.labels(tags || {});
        internal.set(value);
    }
    async timing(name: string, value: number, tags?: Record<string, string>): Promise<void> {
        const {histogram} = this.getMetrics(name, {tags});
        let internal = histogram.labels(tags || {});
        internal.observe(value);
    }
    async flush(): Promise<boolean> {
        return true;
    }
}
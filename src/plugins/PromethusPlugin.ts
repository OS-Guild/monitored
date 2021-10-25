import {Counter, Histogram, register as registry} from 'prom-client';
import {MetricOptions, MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

export interface PrometheusPluginOptions {
    defaultBuckets?: number[];
}

const DEFAULT_BUCKETS: number[] = [10, 20, 50, 100, 150, 200]; // TODO: Replace this with actual buckets

export class PrometheusPlugin implements MonitoredPlugin {
    private readonly histograms: Record<string, Histogram<string>> = {};
    private readonly counters: Record<string, Counter<string>> = {};

    constructor(private readonly opts: PrometheusPluginOptions) {}

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
                buckets: this.opts.defaultBuckets ?? DEFAULT_BUCKETS,
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

        return {histogram: this.histograms[scope], counter: this.counters[scope]};
    }

    async metrics(): Promise<string> {
        return await registry.metrics();
    }
}

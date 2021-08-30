import {Counter, Histogram} from 'prom-client';
import {MonitoredPlugin, MetricOptions, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

export interface PrometheusPluginOptions {
    defaultBuckets?: number[];
}

export class PrometheusPlugin implements MonitoredPlugin {
    private readonly histograms: Record<string, Histogram<string>> = {};
    private readonly counters: Record<string, Counter<string>> = {};

    constructor(private readonly opts: PrometheusPluginOptions) {}

    async onStart({scope, options}: OnStartOptions): Promise<void> {
        const {counter} = this.getMetrics(scope, options);
        counter.inc({result: 'start', ...options?.tags});
    }

    async onSuccess({scope, options, executionTime}: OnSuccessOptions): Promise<void> {
        const {counter, histogram} = this.getMetrics(scope, options);
        const labels = {result: 'success', ...options?.tags};

        counter.inc(labels);
        histogram.observe(labels, executionTime);
    }

    async onFailure({scope, options, executionTime}: OnFailureOptions): Promise<void> {
        const {counter, histogram} = this.getMetrics(scope, options);
        const labels = {result: 'failure', ...options?.tags};

        counter.inc(labels);
        histogram.observe(labels, executionTime);
    }

    private getMetrics(scope: string, options?: MetricOptions) {
        if (!this.histograms[scope]) {
            const histogram = new Histogram({
                name: `${scope}_execution_time`,
                help: `${scope}_execution_time`,
                buckets: this.opts.defaultBuckets,
                labelNames: ['result', ...Object.keys(options?.tags ?? {})],
            });
            this.histograms[scope] = histogram;
        }
        if (!this.counters[scope]) {
            const counter = new Counter({
                name: `${scope}_count`,
                help: `${scope}_count`,
                labelNames: ['result', ...Object.keys(options?.tags ?? {})],
            });
            this.counters[scope] = counter;
        }

        return {histogram: this.histograms[scope], counter: this.counters[scope]};
    }
}

import {CloudWatch, CloudWatchClientConfig} from '@aws-sdk/client-cloudwatch';
import {MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';
import {timeoutPromise} from '../utils';

export interface CloudWatchPluginOptions extends CloudWatchClientConfig {
    serviceName: string;
}

// https://docs.aws.amazon.com/lambda/latest/operatorguide/custom-metrics.html
export class CloudWatchPlugin implements MonitoredPlugin {
    private cloudWatch: CloudWatch;
    private promises: Promise<void>[] = [];

    constructor(private readonly opts: CloudWatchPluginOptions) {
        this.cloudWatch = new CloudWatch(opts);
    }

    private async sendMetric<T extends string>(
        name: T,
        unit: string,
        value: number,
        tags?: Record<string, string>
    ): Promise<void> {
        console.log('before metric', tags);
        await this.cloudWatch.putMetricData({
            Namespace: this.opts.serviceName,
            MetricData: [
                {
                    MetricName: name,
                    Unit: unit,
                    Value: value,
                    Dimensions: Object.entries(tags ?? {}).map(([x, y]) => ({Name: x, Value: y})),
                },
            ],
        });
        console.log('after metric', tags);
    }

    async increment<T extends string>(
        name: T,
        value?: number | undefined,
        tags?: Record<string, string> | undefined
    ): Promise<void> {
        await this.sendMetric(name, 'Count', value ?? 1, tags);
    }

    gauge(_name: string, _value?: number | undefined, _tags?: Record<string, string> | undefined): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async timing(name: string, value: number, tags?: Record<string, string> | undefined): Promise<void> {
        await this.sendMetric(name, 'Seconds', value, tags);
    }

    async flush(timeout: number): Promise<boolean> {
        try {
            console.log('promises', this.promises);
            await timeoutPromise(
                timeout,
                Promise.all(this.promises),
                'Timeout reached, stopped wait for pending log writes'
            );
            console.log('promises1', this.promises);

            return true;
        } catch (err) {
            console.log('sdfsd', err);
            return false;
        }
    }

    onStart({scope, options}: OnStartOptions): void {
        const labels: Record<string, string> = {result: 'start', ...options?.tags};
        this.promises.push(this.increment(scope, 1, labels));
    }

    onSuccess({scope, options, executionTime}: OnSuccessOptions): void {
        const labels = {result: 'success', ...options?.tags};
        this.promises.push(this.timing(scope, executionTime, labels));
    }

    onFailure({scope, options, executionTime}: OnFailureOptions): void {
        const labels = {result: 'failure', ...options?.tags};
        this.promises.push(this.timing(scope, executionTime, labels));
    }
}

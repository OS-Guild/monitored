import {pascalCase} from 'pascal-case';
import {createMetricsLogger, Unit} from 'aws-embedded-metrics';
import {MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';
import {timeoutPromise} from '../utils';

export interface CloudWatchPluginOptions {
    serviceName: string;
}

const pascalifyObject = (obj: Record<string, string>): Record<string, string> =>
    Object.keys(obj).reduce((prev, curr) => {
        prev[pascalCase(curr)] = obj[curr];
        return prev;
    }, {});

// https://docs.aws.amazon.com/lambda/latest/operatorguide/custom-metrics.html
export class LambdaEmbeddedMetricsPlugin implements MonitoredPlugin {
    private promises: Promise<void>[] = [];

    constructor(readonly opts: CloudWatchPluginOptions) {}

    private async sendMetric<T extends string>(
        name: T,
        unit: Unit,
        value: number,
        tags?: Record<string, string>,
        context?: Record<string, string> | undefined
    ): Promise<void> {
        const metrics = createMetricsLogger();

        const dimensions = pascalifyObject(tags ?? {});
        const properties = pascalifyObject(context ?? {});

        metrics.setDimensions(dimensions);
        Object.entries(properties).map(([x, y]) => metrics.setProperty(x, y));

        metrics.putMetric(name, value, unit);

        metrics.flushPreserveDimensions = false;
        await metrics.flush();
    }

    async increment<T extends string>(
        name: T,
        value?: number | undefined,
        tags?: Record<string, string> | undefined,
        context?: Record<string, string> | undefined
    ): Promise<void> {
        await this.sendMetric(name, Unit.Count, value ?? 1, tags, context);
    }

    gauge(_name: string, _value?: number | undefined, _tags?: Record<string, string> | undefined): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async timing(
        name: string,
        value: number,
        tags?: Record<string, string> | undefined,
        context?: Record<string, string> | undefined
    ): Promise<void> {
        await this.sendMetric(name, Unit.Seconds, value, tags, context);
    }

    async flush(timeout: number): Promise<boolean> {
        try {
            await timeoutPromise(
                timeout,
                Promise.all(this.promises),
                'Timeout reached, stopped wait for pending log writes'
            );
            return true;
        } catch (err) {
            console.log('sdfsd', err);
            return false;
        }
    }

    onStart({scope, options}: OnStartOptions): void {
        this.promises.push(this.increment(`${scope}Start`, 1, options?.tags, options?.context));
    }

    onSuccess({scope, options, executionTime}: OnSuccessOptions): void {
        this.promises.push(this.timing(`${scope}Success`, executionTime, options?.tags, options?.context));
    }

    onFailure({scope, options, executionTime}: OnFailureOptions): void {
        this.promises.push(this.timing(`${scope}Failure`, executionTime, options?.tags, options?.context));
    }
}
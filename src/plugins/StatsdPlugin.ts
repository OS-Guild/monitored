import {ClientOptions, StatsD, Tags} from 'hot-shots';
import {promisify} from 'util';
import {timeoutPromise} from '../utils';
import {Logger} from '../Logger';
import {InitializationOptions, MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

const noop = () => {};

export interface StatsdPluginOptions extends Omit<ClientOptions, 'prefix'> {
    serviceName: string;
    apiKey: string;
    root: string;
    host: string;
    port?: number;
}

export class StatsdPlugin implements MonitoredPlugin {
    private readonly client: StatsD;
    private promiseCount: number;
    private readonly pendingPromises: Record<number, Promise<any>>;
    private logger?: Logger;

    private readonly _increment: (name: string, value: number, tags?: Tags) => Promise<void>;
    private readonly _gauge: (name: string, value: number, tags?: Tags) => Promise<void>;
    private readonly _timing: (name: string, value: number, tags?: Tags) => Promise<void>;
    close: () => Promise<void>;

    constructor(rawOptions: StatsdPluginOptions) {
        const {apiKey, root, port, ...rest} = rawOptions;
        const prefixesArray = [apiKey, root, rawOptions.serviceName].filter(Boolean);
        const prefix = `${prefixesArray.join('.')}.`;

        const options: ClientOptions = {
            port: port ?? 8125,
            prefix,
            ...rest,
        };

        this.client = new StatsD({cacheDns: true, ...options});

        this.promiseCount = 0;
        this.pendingPromises = {};

        this._increment = promisify(this.client.increment.bind(this.client));
        this._gauge = promisify(this.client.gauge.bind(this.client));
        this._timing = promisify(this.client.timing.bind(this.client));
        this.close = promisify(this.client.close.bind(this.client));
    }

    initialize({logger}: InitializationOptions): void {
        this.logger = logger;
    }

    onStart({scope, options}: OnStartOptions) {
        this.increment(`${scope}.start`, 1, options?.tags);
    }

    onSuccess({scope, executionTime, options}: OnSuccessOptions) {
        this.increment(`${scope}.success`, 1, options?.tags);
        this.gauge(`${scope}.ExecutionTime`, executionTime, options?.tags);
        this.timing(`${scope}.ExecutionTime`, executionTime, options?.tags);
    }

    onFailure({scope, options}: OnFailureOptions) {
        this.increment(`${scope}.error`, 1, options?.tags);
    }

    get statsd() {
        return this.client;
    }

    async increment(name: string, value: number = 1, tags?: Tags) {
        try {
            await this.wrapStatsdPromise(this._increment(name, value, tags));
        } catch (err) {
            this.logger?.error(`Failed to send increment: ${name}`, err as Error);
        }
    }

    async gauge(name: string, value: number, tags?: Tags) {
        try {
            await this.wrapStatsdPromise(this._gauge(name, value, tags));
        } catch (err) {
            this.logger?.error(`Failed to send gauge: ${name}`, err as Error);
        }
    }

    async timing(name: string, value: number, tags?: Tags) {
        try {
            await this.wrapStatsdPromise(this._timing(name, value, tags));
        } catch (err) {
            this.logger?.error(`Failed to send timing: ${name}`, err as Error);
        }
    }

    async flush(timeout: number = 2000) {
        const remainingPromises = Object.values(this.pendingPromises).map((p) => p.catch(noop));
        if (!remainingPromises.length) {
            return true;
        }

        try {
            await timeoutPromise(
                timeout,
                Promise.all(remainingPromises),
                'Timeout reached, stopped wait for pending log writes'
            );
            return true;
        } catch (err) {
            this.logger?.error('flush timeout', err as Error);
            return false;
        }
    }

    private async wrapStatsdPromise<R = void>(prom: Promise<R>): Promise<R> {
        const currentCount = this.incrementPromiseCount();

        try {
            this.pendingPromises[currentCount] = prom;
            return await this.pendingPromises[currentCount];
        } finally {
            delete this.pendingPromises[currentCount];
        }
    }

    private incrementPromiseCount() {
        this.promiseCount = (this.promiseCount + 1) % Number.MAX_SAFE_INTEGER;
        return this.promiseCount;
    }
}

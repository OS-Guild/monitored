import {StatsD, ClientOptions, Tags} from 'hot-shots';
import {promisify} from 'util';
import {timeoutPromise} from '../utils';
import {Logger} from '../Logger';
import IMetricsProvider from './IMetricsProvider';
const noop = () => {};

export class AsyncStatsD implements IMetricsProvider {
    private client: StatsD;
    private logger: Logger;
    private promiseCount: number;
    private pendingPromises: Record<number, Promise<any>>;

    private _increment: (name: string, value: number, tags?: Tags) => Promise<void>;
    private _gauge: (name: string, value: number, tags?: Tags) => Promise<void>;
    private _timing: (name: string, value: number, tags?: Tags) => Promise<void>;
    close: () => Promise<void>;

    constructor(logger: Logger, options?: ClientOptions) {
        this.client = new StatsD({cacheDns: true, ...options});
        this.logger = logger;
        this.promiseCount = 0;
        this.pendingPromises = {};

        this._increment = promisify(this.client.increment.bind(this.client));
        this._gauge = promisify(this.client.gauge.bind(this.client));
        this._timing = promisify(this.client.timing.bind(this.client));
        this.close = promisify(this.client.close.bind(this.client));
    }

    onStart =  async (name: string) => this.increment(`${name}.start`, 1);
    onSuccess = async (name: string, executionTime: number) => {
        await Promise.all([
            this.increment(`${name}.success`, 1),
            this.gauge(`${name}.ExecutionTime`, executionTime),
            this.timing(`${name}.ExecutionTime`, executionTime)])
        };
    
    onFailure =  async (name: string, _: number) => this.increment(`${name}.error`, 1);

    get statsd() {
        return this.client;
    }

    increment = async (name: string, value: number = 1, tags?: Tags) => {
        try {
            await this.wrapStatsdPromise(this._increment(name, value, tags));
        } catch (err) {
            this.logger.error(`Failed to send increment: ${name}`, err);
        }
    };

    gauge = async (name: string, value: number, tags?: Tags) => {
        try {
            await this.wrapStatsdPromise(this._gauge(name, value, tags));
        } catch (err) {
            this.logger.error(`Failed to send gauge: ${name}`, err);
        }
    };

    timing = async (name: string, value: number, tags?: Tags) => {
        try {
            await this.wrapStatsdPromise(this._timing(name, value, tags));
        } catch (err) {
            this.logger.error(`Failed to send timing: ${name}`, err);
        }
    };

    flush = async (timeout: number = 2000) => {
        const remainingPromises = Object.values(this.pendingPromises).map(p => p.catch(noop));

        if (remainingPromises.length > 0) {
            try {
                await timeoutPromise(
                    timeout,
                    Promise.all(remainingPromises),
                    'Timeout reached, stopped wait for pending log writes'
                );
            } catch (err) {
                this.logger.error('flush timeout', err);

                return false;
            }
        }

        return true;
    };

    private wrapStatsdPromise = async <R = void>(prom: Promise<R>): Promise<R> => {
        const currentCount = this.incrementPromiseCount();

        try {
            this.pendingPromises[currentCount] = prom;

            return await this.pendingPromises[currentCount];
        } finally {
            delete this.pendingPromises[currentCount];
        }
    };

    private incrementPromiseCount = () => {
        this.promiseCount = (this.promiseCount + 1) % Number.MAX_SAFE_INTEGER;

        return this.promiseCount;
    };
}

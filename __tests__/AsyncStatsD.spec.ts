import {mocked} from 'ts-jest/utils';
import {StatsCb, Tags} from 'hot-shots';
import {StatsdPlugin, StatsdPluginOptions} from '../src/plugins/StatsdPlugin';
import * as MockStatsDPlugin from './__mocks__/plugins/StatsdPlugin';
import {MonitorOptions} from '../src';
import Monitor from '../src/Monitor';
import {assertGaugeWasCalled, assertIncrementWasCalled, assertTimingWasCalled} from './utils';

jest.mock('hot-shots');

const statsdOptions: StatsdPluginOptions = {
    serviceName: 'test',
    apiKey: 'key',
    host: 'host',
    root: 'root',
};

let client: StatsdPlugin;

const plugin = new MockStatsDPlugin.StatsdPlugin();
const defaultMonitorOptions: MonitorOptions = {
    serviceName: 'test-service',
    plugins: [plugin],
};
const monitor = new Monitor({...defaultMonitorOptions});

describe('StatsdPlugin', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        client = new StatsdPlugin(statsdOptions);
    });

    describe('plugin', () => {
        test('onSuccess', () => {
            monitor.monitored('abc', () => 123);

            assertIncrementWasCalled(plugin, 'abc.start');
            assertGaugeWasCalled(plugin, 'abc.ExecutionTime');
            assertTimingWasCalled(plugin, 'abc.ExecutionTime');
        });

        test('onStart', () => {
            monitor.monitored('abc', () => 123);

            assertIncrementWasCalled(plugin, 'abc.start');
            assertIncrementWasCalled(plugin, 'abc.success');
        });

        test('onFailure', () => {
            try {
                monitor.monitored('abc', () => {
                    throw new Error('123');
                });
            } catch (err) {}

            assertIncrementWasCalled(plugin, 'abc.start');
            assertIncrementWasCalled(plugin, 'abc.error');
        });
    });

    describe('increment', () => {
        test('success', async () => {
            mockStatsdCallback(client.statsd.increment, undefined);
            await expect(client.increment('test', 3)).resolves.toEqual(undefined);

            expect(mocked(client.statsd.increment)).toHaveBeenCalledWith('test', 3, undefined, expect.any(Function));
        });

        test('success - use default value', async () => {
            mockStatsdCallback(client.statsd.increment, undefined);
            await expect(client.increment('test')).resolves.toEqual(undefined);

            expect(mocked(client.statsd.increment)).toHaveBeenCalledWith('test', 1, undefined, expect.any(Function));
        });

        test('error', async () => {
            mockStatsdCallback(client.statsd.increment, {error: 'err'});

            await expect(client.increment('test', 3)).resolves.toEqual(undefined);

            expect(mocked(client.statsd.increment)).toHaveBeenCalledWith('test', 3, undefined, expect.any(Function));
        });
    });

    describe('timing', () => {
        test('success', async () => {
            mockStatsdCallback(client.statsd.timing, undefined);
            await expect(client.timing('test', 2000)).resolves.toEqual(undefined);

            expect(mocked(client.statsd.timing)).toHaveBeenCalledWith('test', 2000, undefined, expect.any(Function));
        });

        test('error', async () => {
            mockStatsdCallback(client.statsd.timing, {error: 'err'});

            await expect(client.timing('test', 2000)).resolves.toEqual(undefined);

            expect(mocked(client.statsd.timing)).toHaveBeenCalledWith('test', 2000, undefined, expect.any(Function));
        });
    });

    describe('gauge', () => {
        test('success', async () => {
            mockStatsdCallback(client.statsd.gauge, undefined);
            await expect(client.gauge('test', 1)).resolves.toEqual(undefined);

            expect(mocked(client.statsd.gauge)).toHaveBeenCalledWith('test', 1, undefined, expect.any(Function));
        });

        test('error', async () => {
            mockStatsdCallback(client.statsd.gauge, {error: 'err'});

            await expect(client.gauge('test', 1)).resolves.toEqual(undefined);

            expect(mocked(client.statsd.gauge)).toHaveBeenCalledWith('test', 1, undefined, expect.any(Function));
        });
    });

    describe('flush', () => {
        test('success', async () => {
            mockStatsdCallback(client.statsd.increment);
            client.increment('test', 3);
            client.increment('test', 3);

            mockStatsdCallback(client.statsd.timing, {delay: 1000});
            client.timing('asjkdsajk', 1000);

            await expect(client.flush()).resolves.toEqual(true);
        });

        test('timeout', async () => {
            mockStatsdCallback(client.statsd.increment);
            client.increment('test', 3);
            client.increment('test', 3);

            mockStatsdCallback(client.statsd.timing, {delay: 1500});
            client.timing('asjkdsajk', 1000);

            await expect(client.flush(1000)).resolves.toEqual(false);
        });

        test('success - some promises return errors', async () => {
            try {
                mockStatsdCallback(client.statsd.increment);
                client.increment('test', 3);
                client.increment('test', 3);

                mockStatsdCallback(client.statsd.timing, {delay: 1000, error: 'errrrrrr'});
                client.timing('asjkdsajk', 1000);

                mockStatsdCallback(client.statsd.increment, {delay: 1000, error: 'err2'});
                client.increment('test', 3);
                client.increment('test', 3);

                await expect(client.flush(2000)).resolves.toEqual(true);
            } catch (err) {}
        });
    });
});

interface MockStatsdCallbackOptions {
    delay?: number;
    error?: any;
}

function mockStatsdCallback(
    func: (_a: string, _b: number, _t: Tags, cb: StatsCb) => void,
    opts: MockStatsdCallbackOptions = {}
) {
    const {delay = 50, error = undefined} = opts;

    mocked(func).mockImplementation((_a, _b, _t, cb) => {
        setTimeout(() => cb(error, undefined), delay);
    });
}

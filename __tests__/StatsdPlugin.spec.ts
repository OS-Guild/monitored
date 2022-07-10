import {StatsCb, Tags} from 'hot-shots';
import {mocked} from 'jest-mock';
import Monitor from '../src/Monitor';
import {StatsdPlugin, StatsdPluginOptions} from '../src/plugins/StatsdPlugin';
import {
    assertGaugeWasCalled,
    assertIncrementWasCalled,
    assertIncrementWasNotCalled,
    assertTimingWasCalled,
} from './utils';
import {MockStatsdPlugin} from './__mocks__/plugins/StatsdPlugin';

jest.mock('hot-shots');

const isResultFoundCallable = (result: Awaited<number[]>): boolean => {
    return result.length > 0;
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe('StatsdPlugin', () => {
    let monitor: Monitor;
    let plugin: MockStatsdPlugin;

    beforeEach(() => {
        plugin = new MockStatsdPlugin();
        monitor = new Monitor({
            plugins: [plugin],
        });
    });

    test('onSuccess', () => {
        monitor.monitored('abc', () => 123);

        assertIncrementWasCalled(plugin, 'abc.start');
        assertIncrementWasNotCalled(plugin, 'abc.result.found');
        assertIncrementWasNotCalled(plugin, 'abc.result.notFound');
        assertGaugeWasCalled(plugin, 'abc.ExecutionTime');
        assertTimingWasCalled(plugin, 'abc.ExecutionTime');
    });

    test('onSuccess report result is found', () => {
        monitor.monitored('abc', () => [1, 2], {isResultFound: isResultFoundCallable});

        assertIncrementWasCalled(plugin, 'abc.start');
        assertIncrementWasCalled(plugin, 'abc.result.found');
        assertGaugeWasCalled(plugin, 'abc.ExecutionTime');
        assertTimingWasCalled(plugin, 'abc.ExecutionTime');
    });

    test('onSuccess report result is not found', () => {
        monitor.monitored('abc', () => [], {isResultFound: isResultFoundCallable});

        assertIncrementWasCalled(plugin, 'abc.start');
        assertIncrementWasCalled(plugin, 'abc.result.notFound');
        assertGaugeWasCalled(plugin, 'abc.ExecutionTime');
        assertTimingWasCalled(plugin, 'abc.ExecutionTime');
    });

    test('onStart', () => {
        monitor.monitored('abc', () => 123);

        assertIncrementWasCalled(plugin, 'abc.start');
        assertIncrementWasCalled(plugin, 'abc.success');
    });

    test('onFailure', () => {
        expect(() =>
            monitor.monitored('abc', () => {
                throw new Error('123');
            })
        ).toThrow();

        assertIncrementWasCalled(plugin, 'abc.start');
        assertIncrementWasCalled(plugin, 'abc.error');
        assertIncrementWasNotCalled(plugin, 'abc.result.found');
        assertIncrementWasNotCalled(plugin, 'abc.result.notFound');
    });

    test('onFailure dont report result is found', () => {
        expect(() => {
            monitor
                .monitored(
                    'abc',
                    () => {
                        if (false) {
                            return [1];
                        }
                        throw new Error('123');
                    },
                    {isResultFound: isResultFoundCallable}
                )
                .toThrow(new Error('error'));

            assertIncrementWasCalled(plugin, 'abc.start');
            assertIncrementWasCalled(plugin, 'abc.error');
            assertIncrementWasNotCalled(plugin, 'abc.result.found');
            assertIncrementWasNotCalled(plugin, 'abc.result.notFound');
        });
    });
});

describe('StatsdPlugin - StatsdClient invocation', () => {
    let client: StatsdPlugin;

    beforeEach(() => {
        const statsdOptions: StatsdPluginOptions = {
            serviceName: 'test',
            apiKey: 'key',
            host: 'host',
            root: 'root',
        };
        client = new StatsdPlugin(statsdOptions);
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

            mockStatsdCallback(client.statsd.timing, {delay: 50});
            client.timing('asjkdsajk', 1000);

            await expect(client.flush(50)).resolves.toEqual(true);
        });

        test('timeout', async () => {
            mockStatsdCallback(client.statsd.increment);
            client.increment('test', 3);
            client.increment('test', 3);

            mockStatsdCallback(client.statsd.timing, {delay: 100});
            client.timing('asjkdsajk', 1000);

            await expect(client.flush(50)).resolves.toEqual(false);
        });

        test('success - some promises return errors', async () => {
            mockStatsdCallback(client.statsd.increment);
            client.increment('test', 3);
            client.increment('test', 3);

            mockStatsdCallback(client.statsd.timing, {delay: 50, error: 'errrrrrr'});
            client.timing('asjkdsajk', 1000);

            mockStatsdCallback(client.statsd.increment, {delay: 50, error: 'err2'});
            client.increment('test', 3);
            client.increment('test', 3);

            await expect(client.flush(100)).resolves.toEqual(true);
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

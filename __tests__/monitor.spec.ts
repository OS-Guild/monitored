import Monitor from '../src/Monitor';
import {MonitorOptions} from '../src';
import {
    assertGaugeWasCalled,
    assertIncrementWasCalled,
    assertIncrementWasNotCalled,
    assertTimingWasCalled,
} from './utils';
import {StatsdPlugin} from './__mocks__/plugins/StatsdPlugin';

jest.mock('../src/plugins/StatsdPlugin', () => StatsdPlugin);
jest.mock('../src/loggers', () => ({
    consoleLogger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
    emptyLogger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// const statsdOptions: MonitorOptions['statsd'] = {
//     apiKey: 'key',
//     host: 'host',
//     root: 'root',
// };

const plugin = new StatsdPlugin();
const defaultMonitorOptions: MonitorOptions = {
    serviceName: 'test-service',
    plugins: [plugin],
};

describe('Monitor', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('monitored', () => {
        describe('validate result', () => {
            test('sync function', async () => {
                const mockReturn = 10;
                const mockFunc = jest.fn().mockReturnValue(mockReturn);
                const monitor = new Monitor({...defaultMonitorOptions});

                const res = monitor.monitored('test', mockFunc);

                expect(mockFunc).toBeCalledTimes(1);
                expect(res).toEqual(mockReturn);
            });

            test('async function', async () => {
                const mockReturn = 10;
                const mockFunc = jest.fn().mockResolvedValue(mockReturn);
                const monitor = new Monitor({...defaultMonitorOptions});

                const res = await monitor.monitored('test', mockFunc);

                expect(mockFunc).toBeCalledTimes(1);
                expect(res).toEqual(mockReturn);
            });

            test('sync function throws', async () => {
                const mockError = new Error('error');
                const mockFunc = jest.fn(() => {
                    throw mockError;
                });
                const monitor = new Monitor({...defaultMonitorOptions});

                try {
                    monitor.monitored('test', mockFunc);

                    fail('should throw error');
                } catch (err) {
                    expect(err).toEqual(mockError);
                }

                expect(mockFunc).toBeCalledTimes(1);
            });

            test('async function throws', async () => {
                const mockError = new Error('error');
                const mockFunc = jest.fn().mockRejectedValue(mockError);
                const monitor = new Monitor({...defaultMonitorOptions});

                try {
                    await monitor.monitored('test', mockFunc);

                    fail('should throw error');
                } catch (err) {
                    expect(err).toEqual(mockError);
                }

                expect(mockFunc).toBeCalledTimes(1);
            });
        });

        describe('shouldMonitorExecutionStart', () => {
            test('true', () => {
                const mockReturn = 10;
                const mockFunc = jest.fn().mockReturnValue(mockReturn);
                const monitor = new Monitor({...defaultMonitorOptions, shouldMonitorExecutionStart: true});

                const res = monitor.monitored('test', mockFunc);

                expect(mockFunc).toBeCalledTimes(1);
                expect(res).toEqual(mockReturn);
                assertIncrementWasCalled(plugin, 'test.start');
            });

            test('false', () => {
                const mockReturn = 10;
                const mockFunc = jest.fn().mockReturnValue(mockReturn);
                const monitor = new Monitor({...defaultMonitorOptions, shouldMonitorExecutionStart: false});

                const res = monitor.monitored('test', mockFunc);

                expect(mockFunc).toBeCalledTimes(1);
                expect(res).toEqual(mockReturn);
                assertIncrementWasNotCalled(plugin, 'test.start');
            });
        });

        // TODO: Add assertions to check instance of promise (when async)
        describe('result', () => {
            const mockReturn = 10;

            [false, true].forEach((isAsync) => {
                const mockFunc: any = isAsync
                    ? () =>
                          new Promise<number>((resolve) => {
                              resolve(mockReturn);
                          })
                    : () => mockReturn;

                describe(`${isAsync ? 'async' : 'sync'} function`, () => {
                    test('default options', async () => {
                        const monitor = new Monitor({...defaultMonitorOptions});

                        const res = monitor.monitored('test', mockFunc);

                        isAsync ? expect(res).toBeInstanceOf(Promise) : expect(res).toBe(10);

                        if (isAsync) {
                            await res;
                        }

                        assertIncrementWasCalled(plugin, 'test.success');
                        assertGaugeWasCalled(plugin, 'test.ExecutionTime');
                        assertTimingWasCalled(plugin, 'test.ExecutionTime');
                    });
                });
            });
        });

        describe('error', () => {
            const mockError = new Error('error');

            [false, true].forEach((isAsync) => {
                const mockFunc: any = isAsync
                    ? () =>
                          new Promise<number>((_, reject) => {
                              reject(mockError);
                          })
                    : () => {
                          throw mockError;
                      };

                describe(`${isAsync ? 'async' : 'sync'} function`, () => {
                    test('default options', async () => {
                        const monitor = new Monitor({...defaultMonitorOptions});

                        try {
                            const res = monitor.monitored('test', mockFunc);

                            if (isAsync) {
                                await res;
                            }

                            fail('Should not success');
                        } catch (err) {
                            expect(err).toEqual(mockError);

                            assertIncrementWasCalled(plugin, 'test.error');
                        }
                    });

                    test('send context', async () => {
                        const context = {a: 'a', b: 'bbbbb', c: true};
                        const monitor = new Monitor({...defaultMonitorOptions});

                        try {
                            const res = monitor.monitored('test', mockFunc, {context});

                            if (isAsync) {
                                await res;
                            }

                            fail('Should not success');
                        } catch (err) {
                            expect(err).toEqual(mockError);
                        }
                    });
                });
            });
        });
    });
});

import {MonitorOptions} from '../src';
import Monitor from '../src/Monitor';
import {MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from '../src/plugins/types';

const mockPlugin: jest.Mocked<MonitoredPlugin> = {
    initialize: jest.fn(),
    onStart: jest.fn(),
    onSuccess: jest.fn(),
    onFailure: jest.fn(),
    flush: jest.fn(),
    gauge: jest.fn(),
    increment: jest.fn(),
    timing: jest.fn(),
};

let monitor: Monitor;

function doThrow(err: unknown) {
    return () => {
        throw err;
    };
}

function initMonitor(opts?: Partial<MonitorOptions>) {
    monitor = new Monitor({
        plugins: [mockPlugin],
        ...opts,
    });
}

beforeEach(() => {
    jest.resetAllMocks();
    initMonitor();
});

describe('Monitor', () => {
    describe('validate result', () => {
        test('sync function', async () => {
            const mockReturn = 10;
            const mockFunc = jest.fn().mockReturnValue(mockReturn);

            const res = monitor.monitored('test', mockFunc);

            expect(mockFunc).toBeCalledTimes(1);
            expect(res).toEqual(mockReturn);
        });

        test('async function', async () => {
            const mockReturn = 10;
            const mockFunc = jest.fn().mockResolvedValue(mockReturn);

            const res = await monitor.monitored('test', mockFunc);

            expect(mockFunc).toBeCalledTimes(1);
            expect(res).toEqual(mockReturn);
        });

        test('sync function throws', async () => {
            const mockError = new Error('error');
            const mockFunc = jest.fn(doThrow(mockError));

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

            try {
                await monitor.monitored('test', mockFunc);

                fail('should throw error');
            } catch (err) {
                expect(err).toEqual(mockError);
            }

            expect(mockFunc).toBeCalledTimes(1);
        });
    });

    test.each([true, false])('shouldMonitorExecutionStart=%b', shouldMonitorExecutionStart => {
        const mockReturn = 10;
        const mockFunc = jest.fn().mockReturnValue(mockReturn);
        initMonitor({shouldMonitorExecutionStart});

        const res = monitor.monitored('test', mockFunc);

        expect(mockFunc).toBeCalledTimes(1);
        expect(res).toEqual(mockReturn);

        expect(mockPlugin.onStart).toHaveBeenCalledTimes(shouldMonitorExecutionStart ? 1 : 0);
    });

    test.each([true, false])('result type (isAsync=%b)', async isAsync => {
        const mockReturn = 10;
        const mockFunc = jest.fn(() => (isAsync ? Promise.resolve(mockReturn) : mockReturn));

        const res = monitor.monitored('test', mockFunc);

        if (isAsync) {
            await expect(res).resolves.toBe(mockReturn);
        } else {
            expect(res).toBe(mockReturn);
        }
        expect(mockFunc).toBeCalledTimes(1);
    });

    describe.each([true, false])('error (isAsync=%b)', isAsync => {
        const mockError = new Error('error');
        const mockFunc = () => {
            if (isAsync) {
                return Promise.reject(mockError);
            }
            throw mockError;
        };

        test('default options', async () => {
            if (isAsync) {
                await expect(monitor.monitored('test', mockFunc)).rejects.toBe(mockError);
            } else {
                expect(() => monitor.monitored('test', mockFunc)).toThrow(mockError);
            }

            expect(mockPlugin.onFailure).toHaveBeenCalled();
        });
    });

    describe('options', () => {
        test('context (on success)', async () => {
            const context = {a: 'a', b: 'bbbbb', c: true};
            monitor.monitored('test', () => 123, {context});

            expect(mockPlugin.onStart).toHaveBeenCalledWith<[OnStartOptions]>({
                scope: 'test',
                options: {context},
            });

            expect(mockPlugin.onSuccess).toHaveBeenCalledWith<[OnSuccessOptions]>({
                scope: 'test',
                executionTime: expect.any(Number),
                options: {
                    context,
                },
            });
        });

        test('context (on error)', async () => {
            const context = {a: 'a', b: 'bbbbb', c: true};
            expect(() => monitor.monitored('test', doThrow(new Error()), {context})).toThrow();

            expect(mockPlugin.onStart).toHaveBeenCalledWith<[OnStartOptions]>({
                scope: 'test',
                options: {context},
            });

            expect(mockPlugin.onFailure).toHaveBeenCalledWith<[OnFailureOptions]>({
                scope: 'test',
                executionTime: expect.any(Number),
                reason: expect.any(Error),
                options: {context},
            });
        });

        test('shouldMonitorSuccess', () => {
            const shouldMonitorSuccess = (result: boolean): boolean => result;

            monitor.monitored('test', () => false, {shouldMonitorSuccess});
            expect(mockPlugin.onSuccess).not.toHaveBeenCalled();

            monitor.monitored('test', () => true, {shouldMonitorSuccess});
            expect(mockPlugin.onSuccess).toHaveBeenCalled();
        });

        test('shouldMonitorError', () => {
            const shouldMonitorError = (error: unknown) => !!error;

            expect(() => monitor.monitored('test', doThrow(null), {shouldMonitorError})).toThrow();
            expect(mockPlugin.onFailure).not.toHaveBeenCalled();

            expect(() => monitor.monitored('test', doThrow(new Error()), {shouldMonitorError})).toThrow();
            expect(mockPlugin.onFailure).toHaveBeenCalled();
        });
    });
});

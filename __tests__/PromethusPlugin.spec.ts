import {MonitorOptions} from '../src';
import Monitor from '../src/Monitor';
import {PrometheusPlugin} from '../src/plugins/PromethusPlugin';
import {Counter, Histogram, register} from 'prom-client';

const histogram = {
    observe: jest.fn(),
};

const counter = {
    inc: jest.fn(),
};

jest.mock('prom-client', () => ({
    Histogram: jest.fn().mockImplementation(() => {
        return histogram;
    }),
    Counter: jest.fn().mockImplementation(() => {
        return counter;
    }),
    // TODO: Find a better way to mock this
    register: {},
}));

const plugin = new PrometheusPlugin({});
const defaultMonitorOptions: MonitorOptions = {
    serviceName: 'test-service',
    plugins: [plugin],
};
const monitor = new Monitor({...defaultMonitorOptions});

describe('PrometheusPlugin', () => {
    it('onSuccess', () => {
        monitor.monitored('abc', () => 123);

        expect(Counter).toHaveBeenCalledWith({
            name: `abc_count`,
            help: `abc_count`,
            labelNames: ['result'],
        });

        expect(Histogram).toHaveBeenCalledWith({
            name: `abc_execution_time`,
            help: `abc_execution_time`,
            buckets: expect.any(Array),
            labelNames: ['result'],
        });

        expect(counter.inc).toHaveBeenCalledWith({result: 'start'});
        expect(counter.inc).toHaveBeenCalledWith({result: 'success'});
        expect(histogram.observe).toHaveBeenCalledWith({result: 'success'}, expect.any(Number));
    });

    it('onFailure', () => {
        expect(() =>
            monitor.monitored('abc', () => {
                throw new Error('123');
            })
        ).toThrow();

        expect(counter.inc).toHaveBeenCalledWith({result: 'start'});
        expect(counter.inc).toHaveBeenCalledWith({result: 'failure'});
    });

    it('should call registry', () => {
        register.metrics = jest.fn();

        plugin.metrics();

        expect(register.metrics).toBeCalledTimes(1);
    });

    it('should create different counters and histograms per scope', () => {
        monitor.monitored('abc', () => 123);
        monitor.monitored('123', () => 'abc');

        expect(Counter).toHaveBeenCalledTimes(2);
        expect(Histogram).toHaveBeenCalledTimes(2);

        expect(Counter).toHaveBeenCalledWith({
            name: `abc_count`,
            help: `abc_count`,
            labelNames: ['result'],
        });
        expect(Histogram).toHaveBeenCalledWith({
            name: `abc_execution_time`,
            help: `abc_execution_time`,
            buckets: expect.any(Array),
            labelNames: ['result'],
        });

        expect(Counter).toHaveBeenCalledWith({
            name: `123_count`,
            help: `123_count`,
            labelNames: ['result'],
        });
        expect(Histogram).toHaveBeenCalledWith({
            name: `123_execution_time`,
            help: `123_execution_time`,
            buckets: expect.any(Array),
            labelNames: ['result'],
        });
    });
});

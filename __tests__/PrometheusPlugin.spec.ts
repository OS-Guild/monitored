import {Counter, Histogram, register} from 'prom-client';
import Monitor from '../src/Monitor';
import {PrometheusPlugin, DEFAULT_BUCKETS, PrometheusPluginOptions} from '../src/plugins/PrometheusPlugin';

const histogramObserve = jest.fn();
const counterInc = jest.fn();
const gaugeSet = jest.fn();

const histogram = {
    labels: jest.fn().mockImplementation(() => ({observe: histogramObserve})),
};

const counter = {
    labels: jest.fn().mockImplementation(() => ({inc: counterInc})),
};

const gauge = {
    labels: jest.fn().mockImplementation(() => ({set: gaugeSet})),
};

const isResultFoundCallable = (result: Awaited<number[]>): boolean => {
    return result.length > 0;
};

jest.mock('prom-client', () => ({
    Histogram: jest.fn().mockImplementation(() => histogram),
    Counter: jest.fn().mockImplementation(() => counter),
    Gauge: jest.fn().mockImplementation(() => gauge),
    register: {metrics: jest.fn()},
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('PrometheusPlugin', () => {
    let plugin: PrometheusPlugin;
    let monitor: Monitor;

    function initMonitor(opts?: PrometheusPluginOptions) {
        plugin = new PrometheusPlugin(opts);
        monitor = new Monitor({
            plugins: [plugin],
        });
    }

    beforeEach(() => {
        initMonitor();
    });

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
            buckets: DEFAULT_BUCKETS,
            labelNames: ['result'],
        });

        expect(counter.labels).toHaveBeenCalledWith({result: 'start'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).toHaveBeenCalledWith({result: 'success'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).not.toHaveBeenCalledWith({result: 'found'});
        expect(counter.labels).not.toHaveBeenCalledWith({result: 'notFound'});
        expect(histogram.labels).toHaveBeenCalledWith({result: 'success'});
        expect(histogramObserve).toHaveBeenCalledWith(expect.any(Number));
    });

    it('reports result found on onSuccess', () => {
        monitor.monitored('abc', () => [1, 2, 3], {isResultFound: isResultFoundCallable});

        expect(Counter).toHaveBeenCalledWith({
            name: `abc_count`,
            help: `abc_count`,
            labelNames: ['result'],
        });

        expect(Histogram).toHaveBeenCalledWith({
            name: `abc_execution_time`,
            help: `abc_execution_time`,
            buckets: DEFAULT_BUCKETS,
            labelNames: ['result'],
        });

        expect(counter.labels).toHaveBeenCalledWith({result: 'start'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).toHaveBeenCalledWith({result: 'success'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).toHaveBeenCalledWith({result: 'found'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(histogram.labels).toHaveBeenCalledWith({result: 'success'});
        expect(histogramObserve).toHaveBeenCalledWith(expect.any(Number));
    });

    it('reports result not found on onSuccess', () => {
        monitor.monitored('abc', () => [], {isResultFound: isResultFoundCallable});

        expect(Counter).toHaveBeenCalledWith({
            name: `abc_count`,
            help: `abc_count`,
            labelNames: ['result'],
        });

        expect(Histogram).toHaveBeenCalledWith({
            name: `abc_execution_time`,
            help: `abc_execution_time`,
            buckets: DEFAULT_BUCKETS,
            labelNames: ['result'],
        });

        expect(counter.labels).toHaveBeenCalledWith({result: 'start'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).toHaveBeenCalledWith({result: 'success'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).toHaveBeenCalledWith({result: 'notFound'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(histogram.labels).toHaveBeenCalledWith({result: 'success'});
        expect(histogramObserve).toHaveBeenCalledWith(expect.any(Number));
    });

    it('onFailure', () => {
        expect(() =>
            monitor.monitored('abc', () => {
                throw new Error('123');
            })
        ).toThrow();

        expect(counter.labels).toHaveBeenCalledWith({result: 'start'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).toHaveBeenCalledWith({result: 'failure'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).not.toHaveBeenCalledWith({result: 'found'});
        expect(counter.labels).not.toHaveBeenCalledWith({result: 'notFound'});
    });

    it('not to report result found onFailure', () => {
        expect(() =>
            monitor.monitored(
                'abc',
                () => {
                    if (false) {
                        return [1, 2];
                    }
                    throw new Error('123');
                },
                {isResultFound: isResultFoundCallable}
            )
        ).toThrow();

        expect(counter.labels).toHaveBeenCalledWith({result: 'start'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).toHaveBeenCalledWith({result: 'failure'});
        expect(counterInc).toHaveBeenCalledWith(1);
        expect(counter.labels).not.toHaveBeenCalledWith({result: 'found'});
        expect(counter.labels).not.toHaveBeenCalledWith({result: 'notFound'});
    });

    it('should call registry', () => {
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
            buckets: DEFAULT_BUCKETS,
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
            buckets: DEFAULT_BUCKETS,
            labelNames: ['result'],
        });
    });

    it('should allow passing different buckets for histograms', () => {
        const histogramBuckets = [1, 2, 3];
        initMonitor({histogramBuckets});

        monitor.monitored('abc', () => 123);

        expect(Histogram).toHaveBeenCalledWith({
            name: `abc_execution_time`,
            help: `abc_execution_time`,
            buckets: histogramBuckets,
            labelNames: ['result'],
        });
    });
});

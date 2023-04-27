import {v4 as uuid} from 'uuid';
import Monitor from '../src/Monitor';
import {LambdaEmbeddedMetricsPlugin} from '../src/plugins/LambdaEmbeddedMetricsPlugin';

describe('LambdaEmbeddedMetricsPlugin', () => {
    let plugin: LambdaEmbeddedMetricsPlugin;
    let monitor: Monitor;
    let serviceName: string;

    function initMonitor(_opts?: LambdaEmbeddedMetricsPlugin) {
        plugin = new LambdaEmbeddedMetricsPlugin({serviceName});
        monitor = new Monitor({plugins: [plugin]});
    }

    beforeEach(() => {
        jest.useFakeTimers();

        serviceName = uuid();
        initMonitor();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('onSuccess', async () => {
        const metricName = uuid();
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await monitor.monitored(metricName, async () => 123);

        await monitor.flush(1000);
        const {calls} = logSpy.mock;
        const firstCall = JSON.parse(calls[0][0]);
        delete firstCall._aws.Timestamp;
        const lastCall = JSON.parse(calls[1][0]);
        delete lastCall._aws.Timestamp;

        expect(firstCall).toEqual(
            expect.objectContaining({
                _aws: {
                    CloudWatchMetrics: [
                        {
                            Dimensions: [],
                            Metrics: [{Name: `${metricName}Start`, Unit: 'Count'}],
                            Namespace: 'aws-embedded-metrics',
                        },
                    ],
                },
                [`${metricName}Start`]: 1,
            })
        );

        expect(lastCall).toEqual(
            expect.objectContaining({
                _aws: {
                    CloudWatchMetrics: [
                        {
                            Dimensions: [],
                            Metrics: [{Name: `${metricName}Success`, Unit: 'Seconds'}],
                            Namespace: 'aws-embedded-metrics',
                        },
                    ],
                },
                [`${metricName}Success`]: 0,
            })
        );
    });

    it('onError', async () => {
        const metricName = uuid();
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        try {
            await monitor.monitored(metricName, async () => {
                throw new Error(uuid());
            });
        } catch (err) {
            console.log(err);
        }

        await monitor.flush(2000);

        const {calls} = logSpy.mock;

        const firstCall = JSON.parse(calls[0][0]);
        delete firstCall._aws.Timestamp;
        const lastCall = JSON.parse(calls[2][0]);
        delete lastCall._aws.Timestamp;

        expect(firstCall).toEqual(
            expect.objectContaining({
                _aws: {
                    CloudWatchMetrics: [
                        {
                            Dimensions: [],
                            Metrics: [{Name: `${metricName}Start`, Unit: 'Count'}],
                            Namespace: 'aws-embedded-metrics',
                        },
                    ],
                },
                [`${metricName}Start`]: 1,
            })
        );

        expect(lastCall).toEqual(
            expect.objectContaining({
                _aws: {
                    CloudWatchMetrics: [
                        {
                            Dimensions: [],
                            Metrics: [{Name: `${metricName}Failure`, Unit: 'Seconds'}],
                            Namespace: 'aws-embedded-metrics',
                        },
                    ],
                },
                [`${metricName}Failure`]: 0,
            })
        );
    });
});

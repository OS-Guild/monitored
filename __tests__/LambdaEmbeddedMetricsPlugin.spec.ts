import {v4 as uuid} from 'uuid';
import Monitor from '../src/Monitor';
import {LambdaEmbeddedMetricsPlugin} from '../src/plugins/LambdaEmbeddedMetricsPlugin';
import {pascalCase} from 'pascal-case';
import {StorageResolution} from 'aws-embedded-metrics';

const pascalifyObject = (obj: Record<string, string>): Record<string, string> =>
    Object.keys(obj).reduce((prev, curr) => {
        prev[pascalCase(curr)] = obj[curr];
        return prev;
    }, {});

const generateExpectedCall = (
    serviceName: string,
    metricName: string,
    status: 'Start' | 'Success' | 'Failure',
    unit: 'Count' | 'Milliseconds',
    value: number,
    context: {},
    tags: {},
    storageResolution?: StorageResolution
) => ({
    ...context,
    ...tags,
    _aws: {
        CloudWatchMetrics: [
            {
                Dimensions: [Object.keys(tags)],
                Metrics: [
                    {
                        Name: `${metricName}${status}`,
                        Unit: unit,
                        ...(storageResolution && {StorageResolution: storageResolution}),
                    },
                ],
                Namespace: serviceName,
            },
        ],
    },
    [`${metricName}${status}`]: value,
});

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
        const logSpy = jest.spyOn(console, 'log');
        const tags = {[`dimension_${uuid()}`]: uuid(), [`dimension_${uuid()}`]: uuid()};
        const expectedTags = pascalifyObject(tags);

        const context = {[`property_${uuid()}`]: uuid(), [`property_${uuid()}`]: uuid()};
        const expectedContext = pascalifyObject(context);

        await monitor.monitored(metricName, async () => 123, {tags, context});

        await monitor.flush(1000);
        const {calls} = logSpy.mock;

        const firstCall = JSON.parse(calls[0][0]);
        delete firstCall._aws.Timestamp;
        const lastCall = JSON.parse(calls[1][0]);
        delete lastCall._aws.Timestamp;

        expect(firstCall).toEqual(
            expect.objectContaining(
                generateExpectedCall(serviceName, metricName, 'Start', 'Count', 1, expectedContext, expectedTags)
            )
        );

        expect(lastCall).toEqual(
            expect.objectContaining(
                generateExpectedCall(
                    serviceName,
                    metricName,
                    'Success',
                    'Milliseconds',
                    0,
                    expectedContext,
                    expectedTags,
                    StorageResolution.High
                )
            )
        );
    });

    it('onError', async () => {
        const metricName = uuid();
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const tags = {[`dimension_${uuid()}`]: uuid(), [`dimension_${uuid()}`]: uuid()};
        const expectedTags = pascalifyObject(tags);

        const context = {[`property_${uuid()}`]: uuid(), [`property_${uuid()}`]: uuid()};
        const expectedContext = pascalifyObject(context);

        try {
            await monitor.monitored(
                metricName,
                async () => {
                    throw new Error(uuid());
                },
                {tags, context}
            );
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
            expect.objectContaining(
                generateExpectedCall(serviceName, metricName, 'Start', 'Count', 1, expectedContext, expectedTags)
            )
        );

        expect(lastCall).toEqual(
            expect.objectContaining(
                generateExpectedCall(
                    serviceName,
                    metricName,
                    'Failure',
                    'Milliseconds',
                    0,
                    expectedContext,
                    expectedTags,
                    StorageResolution.High
                )
            )
        );
    });
});

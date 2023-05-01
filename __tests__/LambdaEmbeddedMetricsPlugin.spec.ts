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
    status: 'Start' | 'Success' | 'Failure' | 'SuccessExecutionTime' | 'FailureExecutionTime',
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
        const expectedTags = {Service: serviceName, ...pascalifyObject(tags)};

        const context = {[`property_${uuid()}`]: uuid(), [`property_${uuid()}`]: uuid()};
        const expectedContext = pascalifyObject(context);

        await monitor.monitored(metricName, async () => 123, {tags, context});

        await monitor.flush(1000);
        const {calls} = logSpy.mock;

        const startCall = JSON.parse(calls[0][0]);
        delete startCall._aws.Timestamp;
        const successCall = JSON.parse(calls[1][0]);
        delete successCall._aws.Timestamp;
        const successExecutionTimeCall = JSON.parse(calls[2][0]);
        delete successExecutionTimeCall._aws.Timestamp;

        expect(startCall).toEqual(
            expect.objectContaining(
                generateExpectedCall(serviceName, metricName, 'Start', 'Count', 1, expectedContext, expectedTags)
            )
        );

        expect(successCall).toEqual(
            expect.objectContaining(
                generateExpectedCall(serviceName, metricName, 'Success', 'Count', 1, expectedContext, expectedTags)
            )
        );

        expect(successExecutionTimeCall).toEqual(
            expect.objectContaining(
                generateExpectedCall(
                    serviceName,
                    metricName,
                    'SuccessExecutionTime',
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
        const expectedTags = {Service: serviceName, ...pascalifyObject(tags)};

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

            await monitor.flush(2000);

            const {calls} = logSpy.mock;

            const startCall = JSON.parse(calls[0][0]);
            delete startCall._aws.Timestamp;
            const failureCall = JSON.parse(calls[2][0]);
            delete failureCall._aws.Timestamp;
            const failureExecutionTimeCall = JSON.parse(calls[3][0]);
            delete failureExecutionTimeCall._aws.Timestamp;

            expect(startCall).toEqual(
                expect.objectContaining(
                    generateExpectedCall(serviceName, metricName, 'Start', 'Count', 1, expectedContext, expectedTags)
                )
            );

            expect(failureCall).toEqual(
                expect.objectContaining(
                    generateExpectedCall(serviceName, metricName, 'Failure', 'Count', 1, expectedContext, expectedTags)
                )
            );

            expect(failureExecutionTimeCall).toEqual(
                expect.objectContaining(
                    generateExpectedCall(
                        serviceName,
                        metricName,
                        'FailureExecutionTime',
                        'Milliseconds',
                        0,
                        expectedContext,
                        expectedTags,
                        StorageResolution.High
                    )
                )
            );

            return;
        }

        throw new Error('Function execution should fail');
    });
});

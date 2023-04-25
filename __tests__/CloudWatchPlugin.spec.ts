import * as nock from 'nock';
import {v4 as uuid} from 'uuid';
import Monitor from '../src/Monitor';
import {CloudWatchPlugin} from '../src/plugins/CloudWatchPlugin';

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CloudWatchPlugin', () => {
    let plugin: CloudWatchPlugin;
    let monitor: Monitor;
    let awsEnpoint: string;
    let serviceName: string;

    function initMonitor(_opts?: CloudWatchPlugin) {
        plugin = new CloudWatchPlugin({
            serviceName,
            region: uuid(),
            credentials: {accessKeyId: uuid(), secretAccessKey: uuid()},
            credentialDefaultProvider: uuid(),
            endpoint: awsEnpoint,
        });
        monitor = new Monitor({
            plugins: [plugin],
        });
    }

    beforeEach(() => {
        awsEnpoint = `http://${uuid()}`;
        serviceName = uuid();
        initMonitor();
    });

    it('onSuccess', async () => {
        const metricName = uuid();
        const startBody = new URLSearchParams({
            Namespace: serviceName,
            'MetricData.member.1.MetricName': metricName,
            'MetricData.member.1.Dimensions.member.1.Name': 'result',
            'MetricData.member.1.Dimensions.member.1.Value': 'start',
            'MetricData.member.1.Value': '1',
            'MetricData.member.1.Unit': 'Count',
            Action: 'PutMetricData&Version=2010-08-01',
        });

        const successBody = new URLSearchParams({
            Namespace: serviceName,
            'MetricData.member.1.MetricName': metricName,
            'MetricData.member.1.Dimensions.member.1.Name': 'result',
            'MetricData.member.1.Dimensions.member.1.Value': 'success',
            'MetricData.member.1.Value': '0',
            'MetricData.member.1.Unit': 'Seconds',
            Action: 'PutMetricData&Version=2010-08-01',
        });

        nock(awsEnpoint, {allowUnmocked: true}).post('/', decodeURIComponent(startBody.toString())).reply(200);
        nock(awsEnpoint, {allowUnmocked: true}).post('/', decodeURIComponent(successBody.toString())).reply(200);

        await monitor.monitored(metricName, async () => 123);

        await monitor.flush(4000);
    });

    it('onError', async () => {
        const metricName = uuid();
        const startBody = new URLSearchParams({
            Namespace: serviceName,
            'MetricData.member.1.MetricName': metricName,
            'MetricData.member.1.Dimensions.member.1.Name': 'result',
            'MetricData.member.1.Dimensions.member.1.Value': 'start',
            'MetricData.member.1.Value': '1',
            'MetricData.member.1.Unit': 'Count',
            Action: 'PutMetricData&Version=2010-08-01',
        });

        const errorBody = new URLSearchParams({
            Namespace: serviceName,
            'MetricData.member.1.MetricName': metricName,
            'MetricData.member.1.Dimensions.member.1.Name': 'result',
            'MetricData.member.1.Dimensions.member.1.Value': 'failure',
            'MetricData.member.1.Value': '0',
            'MetricData.member.1.Unit': 'Seconds',
            Action: 'PutMetricData&Version=2010-08-01',
        });

        nock(awsEnpoint, {allowUnmocked: true}).post('/', decodeURIComponent(startBody.toString())).reply(200);
        nock(awsEnpoint, {allowUnmocked: true}).post('/', decodeURIComponent(errorBody.toString())).reply(200);

        try {
            await monitor.monitored(metricName, async () => {
                throw new Error(uuid());
            });
        } catch (err) {
            console.log(err);
        }

        await monitor.flush(9000);
    });
});

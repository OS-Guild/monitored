import {monitored, setGlobalInstance} from './globalInstance';
import {PrometheusPlugin} from './plugins/PrometheusPlugin';
import {Monitor} from './index';

const sleep = (time: number) => {
    return new Promise((res) => setTimeout(res, time));
};

(async () => {
    const plugin = new PrometheusPlugin({});

    setGlobalInstance(
        new Monitor({
            serviceName: '',
            plugins: [plugin],
        })
    );

    monitored('willSucceed', () => {
        return 123;
    });

    try {
        monitored('willFail', () => {
            throw Error('fail me!');
        });
    } catch (e) {}

    await monitored('willSucceedWithTimeout', async () => {
        await sleep(1000);
        return 123;
    });

    console.log(await plugin.metrics());
})().catch((e) => console.log(e));

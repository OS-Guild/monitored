# Bla

-   We always create a counter
-   We always create a histogram
-   The uniq identifier of a request is the `scope`

```ts
new PromProvider({
  countMetricName: scope => `${scope}_count`,
})

promProvider.registerMetric({
  scope: 'bla.bla',
  createHistogram: name => new Histogram({ name, ... }),
  createCounter:
})
```

```ts
type MoreInfo = {
    [key: string]: any;
};

interface MoreInfo extends Record<string, any> {}

sendInfo('...', {groupingHash: '...'});

// bugsnagLogger.ts

interface MoreInfo {
    groupingHash: string;
}

monitor('asdasd', async () => await bla, {});
```

```ts
import {setGlobalInstance, Monitor} from 'monitored';
import {PrometheusPlugin} from '@monitored/plugin-prometheus';
import {StatsdPlugin} from '@monitored/plugin-statd';
import {PinoPlugin} from '@monitored/plugin-pino';

const monitor = new Monitor({
  serviceName: '',
  plugins: [
    new PrometheusPlugin({
      ...
    }),
    new StatsdPlugin({
      apiKey: 'STATSD_API_KEY',
      root: 'testing',
      host: 'STATSD_HOST',
      mock: false,
      shouldMonitorExecutionStart: true,
    }),
    new PinoPlugin(),
  ],
})

setGlobalInstance(
  new Monitor({
    serviceName: 'monitored-example',

    logging: {
      logger: logger,
      logErrorsAsWarnings: false,
      disableSuccessLogs: false,
    },
    statsd: {
      apiKey: 'STATSD_API_KEY',
      root: 'testing',
      host: 'STATSD_HOST',
      mock: false,
    },
    shouldMonitorExecutionStart: true,
  }),
);
```

# Terminology

|         Term         |                                 Definition                                  |
| :------------------: | :-------------------------------------------------------------------------: |
|       `scope`        |                           Identifier of a request                           |
| `name`/`metric name` | Name of the metric that is exposed by a plugin. Calculated from the `scope` |
|       `plugin`       |                                                                             |
|  `global instance`   |                                                                             |
| `monitored options`  |                                                                             |


```ts
function monitored() {
  const requestLifecycle = plugin.createRequestLifecycle();

  requestLifecycle.onStart(...);

  try {
    ...
    requestLifecycle.onSuccess(...);
  } catch {
    requestLifecycle.onFailure(...);
  }
}
```

```ts
function monitored() {
  const requestLifecycle = plugin.createRequestLifecycle();

  plugin.onStart(...);

  try {
    ...
    requestLifecycle.onSuccess(...);
  } catch {
    requestLifecycle.onFailure(...);
  }
}
```
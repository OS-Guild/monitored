# Monitored 🕵️‍♀️

A utility for monitoring services

Monitored is a wrapper function that writes success/error logs and [StatsD](https://github.com/statsd/statsd) metrics (gauge, increment, timing) after execution. It supports both asynchronous and synchronous functions.

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/Soluto/monitored/publish)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/soluto/tweek/blob/master/LICENSE.md)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Quick start

### Yarn

```bash
yarn add monitored
```

### Npm

```bash
npm install monitored
```

<br>

## Initialize

### Call `setGlobalInstance` at the root of the project

To wire this package, you must pass an `Options` object.

```ts
import { setGlobalInstance, Monitor } from 'monitored';

interface MonitorOptions {
    serviceName: string; // Represents the name of the service you are monitoring (mandatory)
    plugins: MonitoredPlugin[]; // Stats plugins, statsD and/or prometheus (mandatory)
    logging?: {
        // Writes success and error logs with the passed in logger (optional)
        logger: any; // logger (mandatory)
        logErrorsAsWarnings?: boolean; // log errors as warnings (optional)
        disableSuccessLogs?: boolean; // When true, will not send success log. defaults to false (optional)
    };
    shouldMonitorExecutionStart?: boolean; // When true will log execution start and will increment a metrics. defaults to true (optional)
    mock?: boolean; //Writes the metrics to logs instead of StatsD for debugging. defaults to false (optional)
}

setGlobalInstance(
    new Monitor({
        serviceName: 'monitored-example',
        logging: {
            logger: logger,
            logErrorsAsWarnings: false,
            disableSuccessLogs: false,
        },
        plugins: [
            new StatsdPlugin({
                serviceName: 'test',
                apiKey: 'key',
                host: 'host',
                root: 'root',
            }),
            new PrometheusPlugin(),
        ],
        shouldMonitorExecutionStart: true,
    })
);
```

<br>

## API

### `monitored`

After execution, a wrapper function writes success/error logs and StatsD metrics (gauge, increment, timing).
<br>

#### `monitored` supports both **Asynchronous** and **Synchronous** functions:

```ts
//Async function:
const result = await monitored('functionName', async () => console.log('example'));

//Sync function:
const result = monitored('functionName', () => {
    console.log('example');
});
```

<br>

### You can also pass a `options` argument to `monitored`:

```ts
type MonitoredOptions = {
    context?: any; //add more information to the logs
    logResult?: boolean; //should write log of the method start and success
    parseResult?: (e: any) => any; //custom parser for result (in case it is logged)
    level?: 'info' | 'debug'; //which log level to write (debug is the default)
    logAsError?: boolean; //enables to write error log in case the global `logErrorsAsWarnings` is on
    logErrorAsInfo?: boolean //enables to write the error as info log
    shouldMonitorError: e => boolean //determines if error should be monitored and logged, defaults to true
    shouldMonitorSuccess: (r: T) => boolean //determines if success result should be monitored and logged, defaults to true
    tags?: Record<string, string>; //add more information/labels to metrics
    isResultFound?: (r: Awaited<T>) => boolean; // predicate, define the conditions of reporting wether a result was empty or not
};
```

#### You can use `context` to add more information to the log, such as user ID

```ts
const result = monitored(
    'functionName',
    () => {
        console.log('example');
    },
    {context: {id: 'some context'}}
);
```

#### You can use `tags` to add labels to metrics

```ts
const result = monitored(
    'functionName',
    () => {
        console.log('example');
    },
    {tags: {'some-label': 'some-value'}}
);
```

#### Also, you can log the function result by setting `logResult` to `true`:

```ts
const result = monitored(
    'functionName',
    () => {
        console.log('example');
    },
    {context: {id: 'some context'}, logResult: true}
);
```

#### You can report an empty result by defining a predicate in  `isResultFound`:

```ts
const result = monitored(
    'functionName',
    () => {
        return [1, 2, 3];
    },
    {context: {id: 'some context'}, isResultFound: (result)=>{return result.length > 0}}
);
```

### `flush`

Wait until all current metrics are sent to the server. <br>
We recommend using it at the end of lambda execution to ensure all metrics are sent.

```ts
import { getGlobalInstance } from 'monitored';

const flushTimeout: number = 2000;
await getGlobalInstance().flush(flushTimeout)
```

## Testing

1. Create a `.env` file with `STATSD_API_KEY` and `STATSD_HOST` values
2. Run `yarn example`
3. Verify manually that console logs and metrics in the statsd server are valid

## Contributing

Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the documentation.
See the [Contribution Guidelines](https://github.com/Soluto/monitored/blob/master/.github/CONTRIBUTING.md) if you'd like to submit a PR.

## License

Licensed under the MIT [License](LICENSE), Copyright © 2020-present [Soluto](https://github.com/Soluto).

Crafted by the [Soluto](https://github.com/Soluto) Open Sourcerers🧙

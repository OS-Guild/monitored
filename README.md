# monitored

A utility for monitoring services

# API

### setGlobalInstance

In order to wire this pacakge you need to pass `Options` object.

`serviceName` - represents the name of the service you are monitoring (mandatory)

`logger` - writes success and error logs with the passed in logger (optional)

`statsd` - writes metrics to statsd server (optional)

```
setGlobalInstance(new Monitor({
    serviceName: 'monitored-example',
    logging: {
        logger,
        logErrorsAsWarnings?: true,
        defaultParseError?: e => new Error(e.message + " defaultParseError")

    },
    statsd: {
        apiKey: 'STATSD_API_KEY',
        root: 'testing',
        host: 'STATSD_HOST',
    },
    shouldMonitorExecutionStart?: boolean; //when true will log execution start and will increment a metrics. defaults to true
}));
```

### monitored

Wrapper function that write success/error logs and statsd metrics (gague, increment, timing) after execution.
It supports both asynchronous and synchronous functions:

```

const asyncFunc1 = monitored('foo1', () => {
    console.log('bar1');
    return Promise.resolve();
});

const asyncFunc2 = monitored('foo2', async () => {
    await Promise.resolve();
    console.log('bar1');
});

const syncFunc = monitored('foo3', () => {
    console.log('bar2');
});
```

You can pass `options` argument to `monitored`:

```
type MonitoredOptions = {
    context?; //add more inforamtion to the logs
    logResult?: boolean; //should write log of the method start and success
    parseResult?: (e: any) => any; //custom parser for result (in case it is logged)
    parseError?: (e: any) => any; //custom parser for different types of errors
    level?: 'info' | 'debug'; //which log level to write (debug is the default)
    logAsError?: boolean; //enables to write error log in case the global `logErrorsAsWarnings` is on
    logErrorAsInfo?: boolean //enables to write the errpr as info log
    shouldMonitorError: e => boolean //determines if error should be monitored and logged, defaults to true
    shouldMonitorSuccess: (r: T) => boolean //determines if success result should be monitored and logged, defaults to true 

};
```

```
const foo3 = monitored('foo3', () => {
    console.log('bar3');
}, {context: {id: 'some context'}});
```

Also you can log the function result by setting `logResult` to `true`:

```
const foo4 = monitored('foo4', () => {
    console.log('bar4');
}, {context: {id: 'some context'}, logResult: true});
```

Full usage documentation is details in `Testing` section

### getStatsdClient

Returns the StatsD client directly, in order to write custom metrics

### flush

Wait for all current metric to be sent to server.
You should use it in the end of lambda execution to make sure all metrics are sent.

```
await monitor.flush(timeout: number = 2000)
```


## Testing

1. Create `.env` file with `STATSD_API_KEY` and `STATSD_HOST` values
2. Run `yarn example`
3. Verify manually that console logs and metrics in the statsd server are valid

import 'dotenv/config';

import {setGlobalInstance, StatsdPlugin, monitored, Monitor, monitorMethod} from '../src';

setGlobalInstance(
    new Monitor({
        plugins: [
            new StatsdPlugin({
                serviceName: 'test',
                apiKey: 'key',
                host: 'host',
                root: 'root',
            }),
        ],
        logging: {
            logger: {warn: console.warn, info: console.info, debug: console.debug, error: console.error},
            logErrorsAsWarnings: true,
        },
    })
);

monitored('foo1', () => 'bar1', {context: {id: 1}, logResult: true});

try {
    monitored(
        'foo2',
        () => {
            throw 'something';
        },
        {logAsError: true}
    );
} catch (e) {
    console.log('caught foo2', e);
}

const someResolvingPromise = (x: string) => Promise.resolve(x);
monitored('foo3', () => someResolvingPromise('some string')).then(s =>
    console.log(`Promise resolved with return value - ${s}`)
);

const someRejectingPromise = (x: string) => Promise.reject(x);
monitored('foo4', () => someRejectingPromise('some reject string')).catch(e => console.log('caught promise', e));

monitored('foo5', () => 'bar5', {context: {id: 5}, logResult: false});

monitored('foo6', () => 'bar6', {context: {id: 6}, logResult: true});

monitored('foo7', () => 'bar5', {level: 'debug'});

monitored('foo8', () => 'bar8', {level: 'info'});

monitored('foo9', () => 'bar9');

try {
    monitored('foo10', () => {
        throw new Error('error!');
    });
} catch {}

monitored('foo11', () => 'bar11');

try {
    monitored(
        'foo12',
        () => {
            throw new Error('error!');
        },
        {logAsError: true, shouldMonitorError: () => false}
    );
} catch {}

monitored(
    'foo13',
    async () => {
        throw new Error('error!');
    },
    {logAsError: true, shouldMonitorError: () => true}
).catch(() => {});

monitored('foo14', () => 'bar14', {shouldMonitorSuccess: () => false});
monitored('foo15', () => 'bar15', {shouldMonitorSuccess: () => true});

try {
    monitored(
        'foo16',
        () => {
            throw new Error('error!');
        },
        {logErrorAsInfo: true}
    );
} catch {}

monitored(
    'foo17',
    async () => {
        throw new Error('error!');
    },
    {logErrorAsInfo: true}
).catch(() => {});

// monitor method using decorator
class Person {
    firstName: string = 'Jon';
    lastName: string = 'Doe';

    @monitorMethod('person', {logErrorAsInfo: true})
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
const person = new Person();
const name = person.getFullName();
console.log(`person's name is ${name}`);

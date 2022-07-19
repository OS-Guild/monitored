import Monitor from './Monitor';
import {MonitoredOptions} from './types';

let instance: Monitor | undefined;

export function setGlobalInstance(monitor: Monitor) {
    instance = monitor;
}

export function getGlobalInstance(): Monitor {
    if (!instance) {
        throw new Error('global instance no set');
    }

    return instance;
}

export const monitored: Monitor['monitored'] = (...args) => getGlobalInstance().monitored(...args);

/**
 * @deprecated since version 2.0
 */
export const getStatsdClient: Monitor['getStatsdClient'] = (...args) => getGlobalInstance().getStatsdClient(...args);
export const increment: Monitor['increment'] = (...args) => getGlobalInstance().increment(...args);
export const gauge: Monitor['gauge'] = (...args) => getGlobalInstance().gauge(...args);
export const timing: Monitor['timing'] = (...args) => getGlobalInstance().timing(...args);

export const monitorMethod = <T>(prefix?: string, options: MonitoredOptions<T> = {}) => {
    return function (_target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const metricName = `${prefix}${prefix ? '.' : ''}${propertyKey}`;
        descriptor.value = monitored(metricName, originalMethod, options);
    };
};

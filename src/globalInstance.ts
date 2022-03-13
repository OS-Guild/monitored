import Monitor from './Monitor';

let instance: Monitor | undefined;

export function setGlobalInstance(monitor: Monitor) {
    instance = monitor;
}

export function getGlobalInstance(): Monitor {
    if (!instance) {
        instance = new Monitor({
            serviceName: '',
            plugins: [],
        });
    }

    return instance;
}

export const monitored: Monitor['monitored'] = (...args) => getGlobalInstance().monitored(...args);
export const getStatsdClient: Monitor['getStatsdClient'] = (...args) => getGlobalInstance().getStatsdClient(...args);
export const increment: Monitor['increment'] = (...args) => getGlobalInstance().increment(...args);
export const gauge: Monitor['gauge'] = (...args) => getGlobalInstance().gauge(...args);
export const timing: Monitor['timing'] = (...args) => getGlobalInstance().timing(...args);

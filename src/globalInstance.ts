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

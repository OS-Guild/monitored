import Monitor from './Monitor';

let instance: Monitor | undefined;

export function setGlobalInstance(monitor: Monitor) {
    instance = monitor;
}

export function getGlobalInstance(): Monitor {
    if (!instance) {
        instance = new Monitor({
            serviceName: '',
        });
    }

    return instance;
}

export const monitored: Monitor['monitored'] = (...args) => getGlobalInstance().monitored(...args);
export const getStatsdClient: Monitor['getMonitoringClient'] = (...args) => getGlobalInstance().getMonitoringClient(...args);

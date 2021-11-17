import {InitializationOptions, MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

export class PluginsWrapper implements Omit<MonitoredPlugin, 'initialize'> {
    constructor(private readonly plugins: MonitoredPlugin[], opts: InitializationOptions) {
        plugins.forEach((p) => p.initialize?.(opts));
    }

    onStart(opts: OnStartOptions): void {
        this.plugins.forEach((p) => p.onStart(opts));
    }

    onSuccess(opts: OnSuccessOptions): void {
        this.plugins.forEach((p) => p.onSuccess(opts));
    }

    onFailure(opts: OnFailureOptions): void {
        this.plugins.forEach((p) => p.onFailure(opts));
    }
}

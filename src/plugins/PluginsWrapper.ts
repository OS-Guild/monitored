import {InitializationOptions, MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

export class PluginsWrapper implements Omit<MonitoredPlugin, 'onInitialization'> {
    constructor(private readonly providers: MonitoredPlugin[], opts: InitializationOptions) {
        providers.forEach((p) => p.onInitialization(opts));
    }

    onStart(opts: OnStartOptions): void {
        this.providers.forEach((p) => p.onStart(opts));
    }

    onSuccess(opts: OnSuccessOptions): void {
        this.providers.forEach((p) => p.onSuccess(opts));
    }

    onFailure(opts: OnFailureOptions): void {
        this.providers.forEach((p) => p.onFailure(opts));
    }
}

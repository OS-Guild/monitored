import {MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

export class PluginsWrapper implements MonitoredPlugin {
    constructor(private readonly providers: MonitoredPlugin[]) {}

    async onStart(opts: OnStartOptions): Promise<void> {
        await Promise.all(this.providers.map((p) => p.onStart(opts)));
    }

    async onSuccess(opts: OnSuccessOptions): Promise<void> {
        await Promise.all(this.providers.map((p) => p.onSuccess(opts)));
    }

    async onFailure(opts: OnFailureOptions): Promise<void> {
        await Promise.all(this.providers.map((p) => p.onFailure(opts)));
    }
}

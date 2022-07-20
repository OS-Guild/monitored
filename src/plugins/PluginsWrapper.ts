import {InitializationOptions, MonitoredPlugin, OnFailureOptions, OnStartOptions, OnSuccessOptions} from './types';

export class PluginsWrapper implements Omit<MonitoredPlugin, 'initialize'> {
    constructor(private readonly plugins: MonitoredPlugin[], opts: InitializationOptions) {
        plugins.forEach(p => p.initialize?.(opts));
    }

    onStart(opts: OnStartOptions): void {
        this.plugins.forEach(p => p.onStart(opts));
    }

    onSuccess(opts: OnSuccessOptions): void {
        this.plugins.forEach(p => p.onSuccess(opts));
    }

    onFailure(opts: OnFailureOptions): void {
        this.plugins.forEach(p => p.onFailure(opts));
    }

    async increment<T extends string>(name: T, value?: number, tags?: Record<string, string>): Promise<void> {
        await Promise.all(this.plugins.map(p => p.increment(name, value, tags)));
    }

    async gauge(name: string, value?: number, tags?: Record<string, string>): Promise<void> {
        await Promise.all(this.plugins.map(p => p.gauge(name, value, tags)));
    }

    async timing(name: string, value?: number, tags?: Record<string, string>): Promise<void> {
        await Promise.all(this.plugins.map(p => p.timing(name, value, tags)));
    }

    async flush(timeout: number): Promise<boolean> {
        const results = await Promise.all(this.plugins.map(p => p.flush(timeout)));
        return results.reduce((a, c) => a && c, true);
    }
}

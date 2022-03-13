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

    async increment(name: string, value: number, tags?: {[key: string]: string} | string[]): Promise<void> {
        for (let index = 0; index < this.plugins.length; index++) {
            const p = this.plugins[index];
            await p.increment(name, value, tags);
        }
    }

    async gauge(name: string, value: number, tags?: string[] | {[key: string]: string}): Promise<void> {
        for (const p of this.plugins) {
            await p.gauge(name, value, tags);
        }
    }

    async timing(name: string, value: number, tags?: string[] | {[key: string]: string}): Promise<void> {
        for (const p of this.plugins) {
            await p.timing(name, value, tags);
        }
    }

    async flush(timeout: number): Promise<boolean> {
        let result = true;
        for (const p of this.plugins) {
            result = result && (await p.flush(timeout));
        }
        return result;
    }
}

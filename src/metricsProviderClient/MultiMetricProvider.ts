import {IMetricsProvider} from './IMetricsProvider';

export class MultiMetricProvider implements IMetricsProvider {
    constructor(private readonly providers: IMetricsProvider[]) {}

    async onStart(name: string): Promise<void> {
        await Promise.all(this.providers.map((p) => p.onStart(name)));
    }

    async onSuccess(name: string, executionTime: number): Promise<void> {
        await Promise.all(this.providers.map((p) => p.onSuccess(name, executionTime)));
    }

    async onFailure(name: string, executionTime: number): Promise<void> {
        await Promise.all(this.providers.map((p) => p.onFailure(name, executionTime)));
    }
}

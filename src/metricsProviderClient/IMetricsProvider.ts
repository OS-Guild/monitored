export default interface IMetricsProviderClient {
  onStart: (name: string) => Promise<void>;
  onSuccess: (name: string, executionTime: number) => Promise<void>;
  onFailure: (name: string, executionTime: number) => Promise<void>;
}
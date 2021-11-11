const actualPlugin = jest.requireActual('../../../src/plugins/StatsdPlugin').StatsdPlugin.prototype;

export class StatsdPlugin {
    onInitialization = actualPlugin.onInitialization;
    onStart = actualPlugin.onStart;
    onSuccess = actualPlugin.onSuccess;
    onFailure = actualPlugin.onFailure;
    increment = jest.fn();
    gauge = jest.fn();
    timing = jest.fn();
    close = jest.fn();
    flush = jest.fn();
}

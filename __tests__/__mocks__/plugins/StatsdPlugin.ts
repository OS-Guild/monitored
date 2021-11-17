const {StatsdPlugin} = jest.requireActual(
    '../../../src/plugins/StatsdPlugin'
) as typeof import('../../../src/plugins/StatsdPlugin');

export class MockStatsdPlugin {
    initialize = StatsdPlugin.prototype.initialize;
    onStart = StatsdPlugin.prototype.onStart;
    onSuccess = StatsdPlugin.prototype.onSuccess;
    onFailure = StatsdPlugin.prototype.onFailure;
    increment = jest.fn();
    gauge = jest.fn();
    timing = jest.fn();
    close = jest.fn();
    flush = jest.fn();
}

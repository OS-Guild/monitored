export class StatsdPlugin {
    constructor() {}

    onStart = jest.fn();
    onSuccess = jest.fn();
    onFailure = jest.fn();
    increment = jest.fn();
    gauge = jest.fn();
    timing = jest.fn();
    close = jest.fn();
    flush = jest.fn();
}

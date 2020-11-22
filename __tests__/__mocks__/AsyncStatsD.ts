export class AsyncStatsD {
    constructor() {}

    increment = jest.fn();
    gauge = jest.fn();
    timing = jest.fn();
    close = jest.fn();
    flush = jest.fn();
}

import {mocked} from 'jest-mock';
import Monitor from '../src/Monitor';

export function assertIncrementWasCalled(monitor: Monitor, metricName: string) {
    expect(mocked(monitor.getStatsdClient()!.increment)).toHaveBeenCalledWith(metricName, 1, undefined);
}

export function assertIncrementWasNotCalled(monitor: Monitor, metricName: string) {
    expect(mocked(monitor.getStatsdClient()!.increment)).not.toHaveBeenCalledWith(metricName, 1, undefined);
}

export function assertTimingWasCalled(monitor: Monitor, metricName: string) {
    expect(mocked(monitor.getStatsdClient()!.timing)).toHaveBeenCalledWith(metricName, expect.any(Number), undefined);
}

export function assertTimingWasNotCalled(monitor: Monitor, metricName: string) {
    expect(mocked(monitor.getStatsdClient()!.timing)).not.toHaveBeenCalledWith(
        metricName,
        expect.any(Number),
        undefined
    );
}

export function assertGaugeWasCalled(monitor: Monitor, metricName: string) {
    expect(mocked(monitor.getStatsdClient()!.gauge)).toHaveBeenCalledWith(metricName, expect.any(Number), undefined);
}

export function assertGaugeWasNotCalled(monitor: Monitor, metricName: string) {
    expect(mocked(monitor.getStatsdClient()!.gauge)).not.toHaveBeenCalledWith(
        metricName,
        expect.any(Number),
        undefined
    );
}

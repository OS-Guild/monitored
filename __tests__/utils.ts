import {mocked} from 'ts-jest/utils';
import Monitor from '../src/Monitor';

export function assertIncrementWasCalled(monitor: Monitor, metricName: string) {
  expect(mocked(monitor.getStatsdClient()!.increment)).toHaveBeenCalledWith(metricName);
}

export function assertIncrementWasNotCalled(monitor: Monitor, metricName: string) {
  expect(mocked(monitor.getStatsdClient()!.increment)).not.toHaveBeenCalledWith(metricName);
}

export function assertTimingWasCalled(monitor: Monitor, metricName: string) {
  expect(mocked(monitor.getStatsdClient()!.timing)).toHaveBeenCalledWith(metricName, expect.any(Number));
}

export function assertTimingWasNotCalled(monitor: Monitor, metricName: string) {
  expect(mocked(monitor.getStatsdClient()!.timing)).not.toHaveBeenCalledWith(metricName, expect.any(Number));
}

export function assertGaugeWasCalled(monitor: Monitor, metricName: string) {
  expect(mocked(monitor.getStatsdClient()!.gauge)).toHaveBeenCalledWith(metricName, expect.any(Number));
}

export function assertGaugeWasNotCalled(monitor: Monitor, metricName: string) {
  expect(mocked(monitor.getStatsdClient()!.gauge)).not.toHaveBeenCalledWith(metricName, expect.any(Number));
}
import {mocked} from 'ts-jest/utils';
import {MockStatsdPlugin} from './__mocks__/plugins/StatsdPlugin';

export function assertIncrementWasCalled(plugin: MockStatsdPlugin, metricName: string) {
    expect(mocked(plugin.increment)).toHaveBeenCalledWith(metricName, 1, undefined);
}

export function assertIncrementWasNotCalled(plugin: MockStatsdPlugin, metricName: string) {
    expect(mocked(plugin.increment)).not.toHaveBeenCalledWith(metricName, 1, undefined);
}

export function assertTimingWasCalled(plugin: MockStatsdPlugin, metricName: string) {
    expect(mocked(plugin.timing)).toHaveBeenCalledWith(metricName, expect.any(Number), undefined);
}

export function assertTimingWasNotCalled(plugin: MockStatsdPlugin, metricName: string) {
    expect(mocked(plugin.timing)).not.toHaveBeenCalledWith(metricName, expect.any(Number), undefined);
}

export function assertGaugeWasCalled(plugin: MockStatsdPlugin, metricName: string) {
    expect(mocked(plugin.gauge)).toHaveBeenCalledWith(metricName, expect.any(Number), undefined);
}

export function assertGaugeWasNotCalled(plugin: MockStatsdPlugin, metricName: string) {
    expect(mocked(plugin.gauge)).not.toHaveBeenCalledWith(metricName, expect.any(Number), undefined);
}

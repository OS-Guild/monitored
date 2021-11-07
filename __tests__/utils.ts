import {mocked} from 'ts-jest/utils';
import {StatsdPlugin} from './__mocks__/plugins/StatsdPlugin';

export function assertIncrementWasCalled(plugin: StatsdPlugin, metricName: string) {
    expect(mocked(plugin.increment)).toHaveBeenCalledWith(metricName, 1, undefined, expect.anything());
}

export function assertIncrementWasNotCalled(plugin: StatsdPlugin, metricName: string) {
    expect(mocked(plugin.increment)).not.toHaveBeenCalledWith(metricName, 1, undefined, expect.anything());
}

export function assertTimingWasCalled(plugin: StatsdPlugin, metricName: string) {
    expect(mocked(plugin.timing)).toHaveBeenCalledWith(metricName, expect.any(Number), undefined, expect.anything());
}

export function assertTimingWasNotCalled(plugin: StatsdPlugin, metricName: string) {
    expect(mocked(plugin.timing)).not.toHaveBeenCalledWith(
        metricName,
        expect.any(Number),
        undefined,
        expect.anything()
    );
}

export function assertGaugeWasCalled(plugin: StatsdPlugin, metricName: string) {
    expect(mocked(plugin.gauge)).toHaveBeenCalledWith(metricName, expect.any(Number), undefined, expect.anything());
}

export function assertGaugeWasNotCalled(plugin: StatsdPlugin, metricName: string) {
    expect(mocked(plugin.gauge)).not.toHaveBeenCalledWith(metricName, expect.any(Number), undefined, expect.anything());
}

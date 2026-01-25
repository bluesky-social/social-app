import { expect, test } from '@jest/globals';
import { add, getEntries } from '#/logger/logDump';
import { LogContext, LogLevel } from '#/logger/types';
test('works', function () {
    var items = [
        {
            id: '1',
            level: LogLevel.Debug,
            context: LogContext.Default,
            message: 'hello',
            metadata: {},
            timestamp: Date.now(),
        },
        {
            id: '2',
            level: LogLevel.Debug,
            context: LogContext.Default,
            message: 'hello',
            metadata: {},
            timestamp: Date.now(),
        },
        {
            id: '3',
            level: LogLevel.Debug,
            context: LogContext.Default,
            message: 'hello',
            metadata: {},
            timestamp: Date.now(),
        },
    ];
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        add(item);
    }
    expect(getEntries()).toEqual(items.reverse());
});

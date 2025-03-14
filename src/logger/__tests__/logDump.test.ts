import {expect, test} from '@jest/globals'

import {add, ConsoleTransportEntry, getEntries} from '#/logger/logDump'
import {LogContext, LogLevel} from '#/logger/types'

test('works', () => {
  const items: ConsoleTransportEntry[] = [
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
  ]

  for (const item of items) {
    add(item)
  }

  expect(getEntries()).toEqual(items.reverse())
})

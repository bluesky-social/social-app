import {expect, test} from '@jest/globals'

import {ConsoleTransportEntry, LogLevel} from '#/logger'
import {add, getEntries} from '#/logger/logDump'

test('works', () => {
  const items: ConsoleTransportEntry[] = [
    {
      id: '1',
      level: LogLevel.Debug,
      message: 'hello',
      metadata: {},
      timestamp: Date.now(),
    },
    {
      id: '2',
      level: LogLevel.Debug,
      message: 'hello',
      metadata: {},
      timestamp: Date.now(),
    },
    {
      id: '3',
      level: LogLevel.Debug,
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

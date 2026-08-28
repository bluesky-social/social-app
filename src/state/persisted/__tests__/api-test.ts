import {describe, expect, it} from '@jest/globals'

import * as persisted from '../index'
import {defaults} from '../schema'

describe('generic persisted API', () => {
  it('rejects session writes', () => {
    expect(() => persisted.write('session', defaults.session)).toThrow(
      "Session state must be written through '#/state/persisted/session'",
    )
  })
})

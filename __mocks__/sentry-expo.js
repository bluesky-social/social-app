import {vi} from 'vitest'

vi.mock('sentry-expo', () => ({
  init: () => vi.fn(),
}))

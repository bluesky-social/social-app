import {vi} from 'vitest'

export const from = vi.fn().mockImplementation(() => {
  return {
    digest: vi.fn().mockImplementation(() => {
      return Promise.resolve('')
    }),
  }
})

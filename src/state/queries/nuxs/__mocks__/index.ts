import {vi} from 'vitest'

export {Nux} from '#/state/queries/nuxs/definitions'

export const useNuxs = vi.fn(() => {
  return {
    nuxs: undefined,
    status: 'loading' as const,
  }
})

export const useNux = vi.fn((id: string) => {
  return {
    nux: undefined,
    status: 'loading' as const,
  }
})

export const useSaveNux = vi.fn(() => {
  return {}
})

export const useResetNuxs = vi.fn(() => {
  return {}
})

import {jest} from '@jest/globals'

export {Nux} from '#/state/queries/nuxs/definitions'

export const useNuxs = jest.fn(() => {
  return {
    nuxs: undefined,
    status: 'loading' as const,
  }
})

export const useNux = jest.fn((id: string) => {
  return {
    nux: undefined,
    status: 'loading' as const,
  }
})

export const useSaveNux = jest.fn(() => {
  return {}
})

export const useResetNuxs = jest.fn(() => {
  return {}
})

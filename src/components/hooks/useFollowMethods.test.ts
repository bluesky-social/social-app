import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'

import {type Shadow} from '#/state/cache/types'
import type * as bsky from '#/types/bsky'
import {useFollowMethods} from './useFollowMethods'

const mockQueueFollow = jest.fn(() => Promise.resolve())
const mockLoggerError = jest.fn()

jest.mock('#/state/queries/profile', () => ({
  useProfileFollowMutationQueue: () => [
    () => mockQueueFollow(),
    () => Promise.resolve(),
  ],
}))
jest.mock('#/state/session', () => ({
  useRequireAuth: () => (fn: () => void) => fn(),
}))
jest.mock('@lingui/react', () => ({useLingui: () => ({_: () => ''})}))
jest.mock('#/logger', () => ({
  logger: {error: (...args: unknown[]) => mockLoggerError(...args)},
}))
jest.mock('#/components/Toast', () => ({show: () => {}}))

const profile = {
  did: 'did:plc:author',
  handle: 'author.test',
} as unknown as Shadow<bsky.profile.AnyProfileView>

afterEach(() => {
  mockLoggerError.mockReset()
  mockQueueFollow.mockReset()
  mockQueueFollow.mockImplementation(() => Promise.resolve())
})

function render(onFollow: () => void) {
  return renderHook(() =>
    useFollowMethods({profile, logContext: 'ProfileHoverCard', onFollow}),
  ).result
}

describe('useFollowMethods', () => {
  it('calls onFollow once the follow succeeds', async () => {
    const onFollow = jest.fn()
    const result = render(onFollow)

    act(() => {
      result.current.follow()
    })

    await waitFor(() => expect(onFollow).toHaveBeenCalledTimes(1))
  })

  it('does not call onFollow when the follow fails', async () => {
    mockQueueFollow.mockImplementation(() => Promise.reject(new Error('nope')))
    const onFollow = jest.fn()
    const result = render(onFollow)

    act(() => {
      result.current.follow()
    })

    await waitFor(() => expect(mockLoggerError).toHaveBeenCalled())
    expect(onFollow).not.toHaveBeenCalled()
  })
})

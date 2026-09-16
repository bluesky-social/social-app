import {deleteLike, deleteRepost, like, repost} from '@bsky/sdk'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'

import {usePdsClient, useSession} from '#/state/session'
import {usePostLikeMutationQueue, usePostRepostMutationQueue} from './post'

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}))

jest.mock('#/analytics', () => ({
  useAnalytics: jest.fn(() => ({metric: jest.fn()})),
}))

jest.mock('#/state/cache/post-shadow', () => ({
  updatePostShadow: jest.fn(),
}))

jest.mock('#/state/session', () => ({
  useAppviewClient: jest.fn(),
  usePdsClient: jest.fn(),
  useSession: jest.fn(() => ({currentAccount: undefined})),
}))

jest.mock('#/state/userActionHistory', () => ({
  like: jest.fn(),
  unlike: jest.fn(),
}))

jest.mock('./profile', () => ({
  findProfileQueryData: jest.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })
  return {promise, resolve}
}

function post(viewer: {like?: string; repost?: string}) {
  return {
    uri: 'at://did:plc:author/app.bsky.feed.post/post',
    cid: 'post-cid',
    author: {did: 'did:plc:author'},
    viewer,
  } as unknown as Parameters<typeof usePostLikeMutationQueue>[0]
}

const queryClient = {}
const pdsClient = {call: jest.fn()}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useQueryClient).mockReturnValue(queryClient as never)
  jest.mocked(usePdsClient).mockReturnValue(pdsClient as never)
  jest.mocked(useSession).mockReturnValue({
    currentAccount: {did: 'did:plc:default'},
  } as never)
  jest.mocked(useMutation).mockImplementation(
    options =>
      ({
        mutateAsync: options.mutationFn,
      }) as ReturnType<typeof useMutation>,
  )
})

it('does not deduplicate likes across accounts', async () => {
  const firstRequest = deferred<{uri: string}>()
  const secondRequest = deferred<{uri: string}>()
  const firstLikeUri = 'at://did:plc:first/app.bsky.feed.like/like'
  const secondLikeUri = 'at://did:plc:second/app.bsky.feed.like/like'
  let likeCalls = 0
  pdsClient.call.mockImplementation(method => {
    if (method === like) {
      return [firstRequest.promise, secondRequest.promise][likeCalls++]
    }
    if (method === deleteLike) return Promise.resolve()
    throw new Error('Unexpected PDS call')
  })

  jest.mocked(useSession).mockReturnValue({
    currentAccount: {did: 'did:plc:first'},
  } as never)
  const first = renderHook(() =>
    usePostLikeMutationQueue(post({}), undefined, undefined, 'ImmersiveVideo'),
  )
  let firstPromise!: Promise<string | undefined>
  act(() => {
    firstPromise = first.result.current[0]()
  })

  jest.mocked(useSession).mockReturnValue({
    currentAccount: {did: 'did:plc:second'},
  } as never)
  const second = renderHook(() =>
    usePostLikeMutationQueue(post({}), undefined, undefined, 'ImmersiveVideo'),
  )
  let secondPromise!: Promise<string | undefined>
  act(() => {
    secondPromise = second.result.current[0]()
  })

  expect(pdsClient.call).toHaveBeenCalledTimes(2)
  await act(async () => {
    firstRequest.resolve({uri: firstLikeUri})
    secondRequest.resolve({uri: secondLikeUri})
    await Promise.all([firstPromise, secondPromise])
  })
  expect(likeCalls).toBe(2)
})

it('does not remove a newer like URI when an older unlike completes', async () => {
  const firstLikeRequest = deferred<{uri: string}>()
  const secondLikeRequest = deferred<{uri: string}>()
  const firstUnlikeRequest = deferred<void>()
  const firstLikeUri = 'at://did:plc:default/app.bsky.feed.like/first'
  const secondLikeUri = 'at://did:plc:default/app.bsky.feed.like/second'
  let likeCalls = 0
  let unlikeCalls = 0
  pdsClient.call.mockImplementation(method => {
    if (method === like) {
      return [firstLikeRequest.promise, secondLikeRequest.promise][likeCalls++]
    }
    if (method === deleteLike) {
      unlikeCalls++
      return unlikeCalls === 1 ? firstUnlikeRequest.promise : Promise.resolve()
    }
    throw new Error('Unexpected PDS call')
  })

  const owner = renderHook(
    ({viewerLike}: {viewerLike?: string}) =>
      usePostLikeMutationQueue(
        post({like: viewerLike}),
        undefined,
        undefined,
        'ImmersiveVideo',
      ),
    {initialProps: {viewerLike: undefined as string | undefined}},
  )
  let firstLikePromise!: Promise<string | undefined>
  act(() => {
    firstLikePromise = owner.result.current[0]()
  })
  await act(async () => {
    firstLikeRequest.resolve({uri: firstLikeUri})
    await firstLikePromise
  })
  owner.rerender({viewerLike: firstLikeUri})

  let firstUnlikePromise!: Promise<string | undefined>
  act(() => {
    firstUnlikePromise = owner.result.current[1]()
  })

  const peer = renderHook(() =>
    usePostLikeMutationQueue(post({}), undefined, undefined, 'ImmersiveVideo'),
  )
  let secondLikePromise!: Promise<string | undefined>
  act(() => {
    secondLikePromise = peer.result.current[0]()
  })
  const stale = renderHook(() =>
    usePostLikeMutationQueue(
      post({like: 'pending'}),
      undefined,
      undefined,
      'ImmersiveVideo',
    ),
  )
  let secondUnlikePromise!: Promise<string | undefined>
  act(() => {
    secondUnlikePromise = stale.result.current[1]()
  })

  await act(async () => {
    firstUnlikeRequest.resolve()
    await firstUnlikePromise
  })
  await act(async () => {
    secondLikeRequest.resolve({uri: secondLikeUri})
    await Promise.all([secondLikePromise, secondUnlikePromise])
  })

  expect(pdsClient.call).toHaveBeenLastCalledWith(deleteLike, secondLikeUri)
})

it('deduplicates likes and shares the URI with another queue instance', async () => {
  const likeRequest = deferred<{uri: string}>()
  const likeUri = 'at://did:plc:me/app.bsky.feed.like/like'
  pdsClient.call.mockImplementation(method => {
    if (method === like) return likeRequest.promise
    if (method === deleteLike) return Promise.resolve()
    throw new Error('Unexpected PDS call')
  })

  const owner = renderHook(
    ({viewerLike}: {viewerLike?: string}) =>
      usePostLikeMutationQueue(
        post({like: viewerLike}),
        undefined,
        undefined,
        'ImmersiveVideo',
      ),
    {initialProps: {viewerLike: undefined as string | undefined}},
  )
  const peer = renderHook(() =>
    usePostLikeMutationQueue(post({}), undefined, undefined, 'ImmersiveVideo'),
  )

  let likePromise!: Promise<string | undefined>
  let peerLikePromise!: Promise<string | undefined>
  act(() => {
    likePromise = owner.result.current[0]()
    peerLikePromise = peer.result.current[0]()
  })
  expect(pdsClient.call).toHaveBeenCalledTimes(1)
  owner.rerender({viewerLike: 'pending'})
  const other = renderHook(() =>
    usePostLikeMutationQueue(
      post({like: 'pending'}),
      undefined,
      undefined,
      'ImmersiveVideo',
    ),
  )
  await act(async () => {
    likeRequest.resolve({uri: likeUri})
    await Promise.all([likePromise, peerLikePromise])
  })
  const latePeer = renderHook(() =>
    usePostLikeMutationQueue(post({}), undefined, undefined, 'ImmersiveVideo'),
  )
  await act(async () => {
    await latePeer.result.current[0]()
  })
  expect(pdsClient.call).toHaveBeenCalledTimes(1)

  await act(async () => {
    await other.result.current[1]()
  })

  expect(pdsClient.call).toHaveBeenLastCalledWith(deleteLike, likeUri)
})

it('deduplicates reposts and shares the URI with another queue instance', async () => {
  const repostRequest = deferred<{uri: string}>()
  const repostUri = 'at://did:plc:me/app.bsky.feed.repost/repost'
  pdsClient.call.mockImplementation(method => {
    if (method === repost) return repostRequest.promise
    if (method === deleteRepost) return Promise.resolve()
    throw new Error('Unexpected PDS call')
  })

  const owner = renderHook(
    ({viewerRepost}: {viewerRepost?: string}) =>
      usePostRepostMutationQueue(
        post({repost: viewerRepost}),
        undefined,
        undefined,
        'ImmersiveVideo',
      ),
    {initialProps: {viewerRepost: undefined as string | undefined}},
  )
  const peer = renderHook(() =>
    usePostRepostMutationQueue(
      post({}),
      undefined,
      undefined,
      'ImmersiveVideo',
    ),
  )

  let repostPromise!: Promise<string | undefined>
  let peerRepostPromise!: Promise<string | undefined>
  act(() => {
    repostPromise = owner.result.current[0]()
    peerRepostPromise = peer.result.current[0]()
  })
  expect(pdsClient.call).toHaveBeenCalledTimes(1)
  owner.rerender({viewerRepost: 'pending'})
  const other = renderHook(() =>
    usePostRepostMutationQueue(
      post({repost: 'pending'}),
      undefined,
      undefined,
      'ImmersiveVideo',
    ),
  )
  await act(async () => {
    repostRequest.resolve({uri: repostUri})
    await Promise.all([repostPromise, peerRepostPromise])
  })
  const latePeer = renderHook(() =>
    usePostRepostMutationQueue(
      post({}),
      undefined,
      undefined,
      'ImmersiveVideo',
    ),
  )
  await act(async () => {
    await latePeer.result.current[0]()
  })
  expect(pdsClient.call).toHaveBeenCalledTimes(1)

  await act(async () => {
    await other.result.current[1]()
  })

  expect(pdsClient.call).toHaveBeenLastCalledWith(deleteRepost, repostUri)
})

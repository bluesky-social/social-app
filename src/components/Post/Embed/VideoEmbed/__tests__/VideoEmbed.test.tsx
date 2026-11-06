import {act, render} from '@testing-library/react-native'

import {type VideoWatchInteraction} from '#/lib/media/video/feedFeedback'
import {type app} from '#/lexicons'
import {VideoEmbed} from '../index'

type InnerProps = {
  setStatus: (status: 'playing' | 'paused') => void
  setIsLoading: (loading: boolean) => void
  setIsActive: (active: boolean) => void
  onPlaybackProgress: (progressSeconds: number) => void
}
let mockInner: InnerProps
const mockInnerMounts = jest.fn()
jest.mock('../VideoEmbedInner/VideoEmbedInnerNative', () => {
  const {useEffect} = jest.requireActual<typeof import('react')>('react')
  return {
    VideoEmbedInnerNative: (props: InnerProps) => {
      mockInner = props
      useEffect(() => mockInnerMounts(), [])
      return null
    },
  }
})

let mockFeedFeedback: {
  sendVideoWatch?: (interaction: VideoWatchInteraction) => void
} = {}
jest.mock('#/state/feed-feedback', () => ({
  useFeedFeedbackContext: () => mockFeedFeedback,
}))
jest.mock('#/analytics', () => {
  const ax = {metric: jest.fn()}
  return {useAnalytics: () => ax}
})
jest.mock('#/lib/appState', () => ({
  getCurrentState: () => 'active',
  useOnAppStateChange: () => {},
}))
jest.mock('expo-image', () => ({ImageBackground: () => null}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  platform: () => ({}),
}))
jest.mock('#/components/Button', () => ({Button: () => null}))
jest.mock('#/components/video/PlayButtonIcon', () => ({
  PlayButtonIcon: () => null,
}))
jest.mock('../GifPresentationControls', () => ({
  GifPresentationControls: () => null,
}))
jest.mock('#/view/com/util/ErrorBoundary', () => ({
  ErrorBoundary: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/components/hooks/useThrottledValue', () => ({
  useThrottledValue: (value: unknown) => value,
}))
jest.mock('#/components/images/AutoSizedImage', () => ({
  ConstrainedImage: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))

const embed = {
  $type: 'app.bsky.embed.video#view',
  cid: 'cid',
  playlist: 'https://video.example/playlist.m3u8',
  thumbnail: 'https://video.example/thumbnail.jpg',
} as app.bsky.embed.video.View
const post = {
  uri: 'at://did:plc:quoted/app.bsky.feed.post/media',
  author: {did: 'did:plc:quoted'},
} as unknown as app.bsky.feed.defs.PostView
const OUTER = 'at://did:plc:outer/app.bsky.feed.post/outer' as const

let time = 0
beforeEach(() => {
  time = 0
  mockInnerMounts.mockClear()
  jest.spyOn(performance, 'now').mockImplementation(() => time)
})

function play(ms: number) {
  act(() => {
    mockInner.onPlaybackProgress(time / 1000)
    time += ms
    mockInner.onPlaybackProgress(time / 1000)
  })
}

function start() {
  act(() => {
    mockInner.setIsActive(true)
    mockInner.setIsLoading(false)
    mockInner.setStatus('playing')
  })
}

it('reports to the outer item without a length, and rebinds without remounting the player', () => {
  const sendA = jest.fn<void, [VideoWatchInteraction]>()
  const sendB = jest.fn<void, [VideoWatchInteraction]>()
  mockFeedFeedback = {sendVideoWatch: sendA}
  const view = render(
    <VideoEmbed
      embed={embed}
      post={post}
      feedbackAttribution={{item: OUTER, feedContext: 'ctx', reqId: 'req-1'}}
    />,
  )
  start()
  play(1000)

  // A refetch hands the same item a new request id.
  view.rerender(
    <VideoEmbed
      embed={embed}
      post={post}
      feedbackAttribution={{item: OUTER, feedContext: 'ctx', reqId: 'req-2'}}
    />,
  )
  expect(sendA).toHaveBeenCalledTimes(1)
  const first = sendA.mock.calls[0][0]
  expect(first).toMatchObject({item: OUTER, reqId: 'req-1'})
  expect(first.videoWatch).toMatchObject({
    durationMs: 1000,
    endReason: 'deactivated',
    context: 'embed',
  })
  // Native inline players only know remaining time.
  expect('videoDurationMs' in first.videoWatch).toBe(false)

  play(500)
  // The feed's queue changes (e.g. route change); the old session flushes
  // through the old sender.
  mockFeedFeedback = {sendVideoWatch: sendB}
  view.rerender(
    <VideoEmbed
      embed={embed}
      post={post}
      feedbackAttribution={{item: OUTER, feedContext: 'ctx', reqId: 'req-2'}}
    />,
  )
  expect(sendA).toHaveBeenCalledTimes(2)
  const second = sendA.mock.calls[1][0]
  expect(second).toMatchObject({item: OUTER, reqId: 'req-2'})
  expect(second.videoWatch.playbackSessionId).not.toBe(
    first.videoWatch.playbackSessionId,
  )

  play(700)
  view.unmount()
  expect(sendB).toHaveBeenCalledTimes(1)
  expect(sendB.mock.calls[0][0].videoWatch).toMatchObject({
    durationMs: 700,
    endReason: 'unmounted',
  })
  expect(mockInnerMounts).toHaveBeenCalledTimes(1)
})

it('sends nothing without explicit attribution', () => {
  const send = jest.fn<void, [VideoWatchInteraction]>()
  mockFeedFeedback = {sendVideoWatch: send}
  const view = render(<VideoEmbed embed={embed} post={post} />)
  start()
  play(1000)
  view.unmount()
  expect(send).not.toHaveBeenCalled()
})

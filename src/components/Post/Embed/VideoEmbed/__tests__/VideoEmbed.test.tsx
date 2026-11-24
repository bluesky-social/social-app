import {act, render} from '@testing-library/react-native'

import {
  type VideoWatchBinding,
  type VideoWatchInteraction,
  type VideoWatchMode,
} from '#/lib/media/video/feedFeedback'
import {type app} from '#/lexicons'
import {VideoEmbed} from '../index'

type InnerProps = {
  setStatus: (status: 'playing' | 'paused') => void
  setIsLoading: (loading: boolean) => void
  setIsActive: (active: boolean) => void
  onPlaybackProgress: (
    progressSeconds: number,
    durationSeconds: number | undefined,
  ) => void
  onPlaybackModeChange: (mode: Partial<VideoWatchMode>) => void
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

/*
 * A real context, like the app's, so a binding change re-renders the player
 * even when its props don't change.
 */
jest.mock('#/features/feedFeedback', () => {
  const {createContext, useContext} =
    jest.requireActual<typeof import('react')>('react')
  const BindingContext = createContext({})
  return {
    BindingContext,
    useVideoWatchBinding: () => useContext(BindingContext),
  }
})
const {BindingContext} = jest.requireMock<{
  BindingContext: React.Context<VideoWatchBinding>
}>('#/features/feedFeedback')
let mockBinding: VideoWatchBinding = {}
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

/** Takes the binding as a prop: the compiler treats module state as constant. */
function Embed({binding}: {binding: VideoWatchBinding}) {
  return (
    <BindingContext.Provider value={binding}>
      <VideoEmbed embed={embed} post={post} />
    </BindingContext.Provider>
  )
}

function play(ms: number, durationSeconds?: number) {
  act(() => {
    mockInner.onPlaybackProgress(time / 1000, durationSeconds)
    time += ms
    mockInner.onPlaybackProgress(time / 1000, durationSeconds)
  })
}

function start(mode: Partial<VideoWatchMode> = {}) {
  act(() => {
    mockInner.setIsActive(true)
    mockInner.setIsLoading(false)
    mockInner.onPlaybackModeChange({
      muted: true,
      fullscreen: false,
      autoplay: true,
      ...mode,
    })
    mockInner.setStatus('playing')
  })
}

function bindTo(
  reqId: string,
  sendVideoWatch: (interaction: VideoWatchInteraction) => void,
) {
  mockBinding = {
    attribution: {item: OUTER, feedContext: 'ctx', reqId},
    sendVideoWatch,
  }
}

it('reports to the feed item, and rebinds without remounting the player', () => {
  const sendA = jest.fn<void, [VideoWatchInteraction]>()
  const sendB = jest.fn<void, [VideoWatchInteraction]>()
  bindTo('req-1', sendA)
  const view = render(<Embed binding={mockBinding} />)
  start()
  play(1000)

  // A refetch hands the same item a new request id.
  bindTo('req-2', sendA)
  view.rerender(<Embed binding={mockBinding} />)
  expect(sendA).toHaveBeenCalledTimes(1)
  const first = sendA.mock.calls[0][0]
  expect(first).toMatchObject({
    item: OUTER,
    reqId: 'req-1',
    event: 'app.bsky.feed.defs#interactionUnspecced',
  })
  expect(first.payload).toMatchObject({
    type: 'videoWatch',
    durationMs: 1000,
    endReason: 'deactivated',
    context: 'embed',
    loop: 0,
  })
  // Until the player reports a length, it's left out.
  expect('videoDurationMs' in first.payload).toBe(false)

  play(500)
  // The feed's queue changes (e.g. route change); the old session flushes
  // through the old sender.
  bindTo('req-2', sendB)
  view.rerender(<Embed binding={mockBinding} />)
  expect(sendA).toHaveBeenCalledTimes(2)
  const second = sendA.mock.calls[1][0]
  expect(second).toMatchObject({item: OUTER, reqId: 'req-2'})
  expect(second.payload.playbackSessionId).not.toBe(
    first.payload.playbackSessionId,
  )

  play(700)
  view.unmount()
  expect(sendB).toHaveBeenCalledTimes(1)
  expect(sendB.mock.calls[0][0].payload).toMatchObject({
    durationMs: 700,
    endReason: 'unmounted',
  })
  expect(mockInnerMounts).toHaveBeenCalledTimes(1)
})

it('sends the length, mode and loop the player reports', () => {
  const send = jest.fn<void, [VideoWatchInteraction]>()
  bindTo('req-1', send)
  const view = render(<Embed binding={mockBinding} />)
  start({autoplay: false, muted: false})
  play(1000, 12.5)
  act(() => mockInner.onPlaybackModeChange({fullscreen: true}))
  play(1000, 12.5)
  // Back to the start: a second time through.
  act(() => mockInner.onPlaybackProgress(0, 12.5))
  play(1000, 12.5)
  view.unmount()

  expect(send.mock.calls.map(([interaction]) => interaction.payload)).toEqual([
    expect.objectContaining({
      endReason: 'fullscreenChanged',
      videoDurationMs: 12500,
      muted: false,
      fullscreen: false,
      autoplay: false,
      loop: 0,
    }),
    expect.objectContaining({
      endReason: 'looped',
      fullscreen: true,
      loop: 0,
    }),
    expect.objectContaining({
      endReason: 'unmounted',
      fullscreen: true,
      loop: 1,
    }),
  ])
})

it('sends nothing outside a feed item', () => {
  const send = jest.fn<void, [VideoWatchInteraction]>()
  mockBinding = {sendVideoWatch: send}
  const view = render(<Embed binding={mockBinding} />)
  start()
  play(1000)
  view.unmount()
  expect(send).not.toHaveBeenCalled()
})

import {act, render} from '@testing-library/react-native'

import {type VideoWatchInteraction} from '#/lib/media/video/feedFeedback'
import {type app} from '#/lexicons'
import {VideoEmbed} from '../index.web'
import {type VideoEmbedInnerWebProps} from '../VideoEmbedInner/VideoEmbedInnerWeb.shared'

let mockInner: VideoEmbedInnerWebProps
jest.mock(
  '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerWeb',
  () => ({
    VideoEmbedInnerWeb: (props: VideoEmbedInnerWebProps) => {
      mockInner = props
      return null
    },
    HLSFatalError: class {},
    HLSUnsupportedError: class {},
    VideoNotFoundError: class {},
  }),
)
const mockSendVideoWatch = jest.fn<void, [VideoWatchInteraction]>()
jest.mock('#/state/feed-feedback', () => ({
  useFeedFeedbackContext: () => ({sendVideoWatch: mockSendVideoWatch}),
}))
jest.mock('../ActiveVideoWebContext', () => ({
  useActiveVideoWeb: () => ({
    active: true,
    setActive: () => {},
    sendPosition: () => {},
    currentActiveView: 'other',
  }),
}))
jest.mock('#/analytics', () => {
  const ax = {metric: jest.fn()}
  return {useAnalytics: () => ax}
})
jest.mock('#/lib/appState', () => ({
  getCurrentState: () => 'active',
  useOnAppStateChange: () => {},
}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({palette: {black: '#000'}}),
}))
jest.mock('#/components/hooks/useFullscreen', () => ({
  useFullscreen: () => [false],
}))
jest.mock('#/components/dms/MessageContext', () => ({
  useIsWithinMessage: () => false,
}))
jest.mock('#/components/images/AutoSizedImage', () => ({
  ConstrainedImage: ({children}: {children: React.ReactNode}) => children,
}))
jest.mock('#/components/MediaInsetBorder', () => ({
  MediaInsetBorder: () => null,
}))
jest.mock('#/view/com/util/ErrorBoundary', () => ({
  ErrorBoundary: ({children}: {children: React.ReactNode}) => children,
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
  mockSendVideoWatch.mockClear()
  jest.spyOn(performance, 'now').mockImplementation(() => time)
  // Every observed element is on screen.
  global.IntersectionObserver = class {
    constructor(private callback: IntersectionObserverCallback) {}
    observe() {
      this.callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: {y: 0, height: 100},
          } as unknown as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      )
    }
    disconnect() {}
  } as unknown as typeof IntersectionObserver
})

it('includes the media element length in watch feedback', () => {
  const view = render(
    <VideoEmbed
      embed={embed}
      post={post}
      feedbackAttribution={{item: OUTER, feedContext: 'ctx', reqId: 'req'}}
    />,
    // The observers need a node to observe.
    {createNodeMock: () => ({})},
  )
  act(() => {
    mockInner.onPlaybackStateChange('playing')
    mockInner.onPlaybackProgress(0, Number.NaN) // metadata not loaded yet
    time += 1000
    mockInner.onPlaybackProgress(1, 42.25)
  })
  view.unmount()

  expect(mockSendVideoWatch).toHaveBeenCalledTimes(1)
  expect(mockSendVideoWatch.mock.calls[0][0]).toMatchObject({
    item: OUTER,
    feedContext: 'ctx',
    reqId: 'req',
    videoWatch: {
      durationMs: 1000,
      videoDurationMs: 42250,
      endReason: 'unmounted',
    },
  })
})

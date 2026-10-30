import {Component} from 'react'
import {Text} from 'react-native'
import {act, fireEvent, render} from '@testing-library/react-native'

import {loadHls} from './loadHls'
import {VideoEmbedInnerWeb} from './VideoEmbedInnerWeb'

jest.mock('./VideoEmbedInnerWeb', () =>
  jest.requireActual('./VideoEmbedInnerWeb.tsx'),
)
jest.mock('./loadHls', () => ({loadHls: jest.fn()}))
jest.mock('./bandwidth-estimate', () => ({get: jest.fn(), set: jest.fn()}))
jest.mock('#/alf', () => ({atoms: {}}))
jest.mock('#/components/AltBadgeWithDialog', () => ({
  AltBadgeWithDialog: () => null,
}))
jest.mock('#/components/hooks/useFullscreen', () => ({
  useFullscreen: () => [false],
}))
jest.mock(
  '#/components/moderation/ReportDialog/ReportDialogMetadataContext',
  () => ({useReportDialogMetadataContext: () => null}),
)
jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {message: string}) => value.message}),
}))
jest.mock('./web-controls/VideoControls', () => ({
  Controls: ({hlsLoading}: {hlsLoading: boolean}) => {
    const {Text: NativeText} =
      require('react-native') as typeof import('react-native')
    return <NativeText testID="loading">{String(hlsLoading)}</NativeText>
  },
}))

class Boundary extends Component<
  {children: React.ReactNode},
  {error: Error | null}
> {
  state = {error: null as Error | null}
  static getDerivedStateFromError(error: Error) {
    return {error}
  }
  render() {
    return this.state.error ? (
      <Text testID="error">{this.state.error.message}</Text>
    ) : (
      this.props.children
    )
  }
}

function Player({
  attempt = 0,
  onPlaybackProgress = () => {},
}: {
  attempt?: number
  onPlaybackProgress?: (
    progressSeconds: number,
    durationSeconds: number,
  ) => void
}) {
  return (
    <Boundary key={attempt}>
      <VideoEmbedInnerWeb
        embed={{
          $type: 'app.bsky.embed.video#view',
          cid: 'test-cid',
          playlist: 'https://video.example/playlist.m3u8',
          thumbnail: 'https://video.example/thumbnail.jpg',
        }}
        active={false}
        setActive={() => {}}
        onScreen
        lastKnownTime={{current: undefined}}
        onPlaybackStart={() => {}}
        onPlaybackProgress={onPlaybackProgress}
        onPlaybackStateChange={() => {}}
        onPlaybackEnd={() => {}}
      />
    </Boundary>
  )
}

afterEach(() => {
  jest.restoreAllMocks()
  jest.mocked(loadHls).mockReset()
})

it('leaves loading state on failure and recovers when the boundary is retried', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  let reject!: (error: Error) => void
  jest.mocked(loadHls).mockReturnValueOnce(
    new Promise((_, rejectPromise) => {
      reject = rejectPromise
    }),
  )
  const view = render(<Player />)
  expect(view.getByTestId('loading').props.children).toBe('true')

  await act(async () => {
    reject(new Error('Loading module https://cdn.example/hls-hash.js failed'))
    await Promise.resolve()
  })
  expect(view.queryByTestId('loading')).toBeNull()
  expect(view.getByTestId('error').props.children).toContain('hls-hash.js')
  expect(loadHls).toHaveBeenCalledTimes(1)

  jest
    .mocked(loadHls)
    .mockResolvedValueOnce(class {} as Awaited<ReturnType<typeof loadHls>>)
  await act(async () => {
    view.rerender(<Player attempt={1} />)
    await Promise.resolve()
  })
  expect(view.queryByTestId('error')).toBeNull()
  expect(view.getByTestId('loading').props.children).toBe('false')
  expect(loadHls).toHaveBeenCalledTimes(2)
})

it('handles a pending import rejection after unmount without an unhandled rejection', async () => {
  let reject!: (error: Error) => void
  jest.mocked(loadHls).mockReturnValueOnce(
    new Promise((_, rejectPromise) => {
      reject = rejectPromise
    }),
  )
  const view = render(<Player />)
  view.unmount()
  await act(async () => {
    reject(new Error('Loading module failed'))
    await Promise.resolve()
  })
  expect(loadHls).toHaveBeenCalledTimes(1)
})

it('reports the media element length with playback progress', () => {
  jest.mocked(loadHls).mockReturnValueOnce(new Promise(() => {}))
  const onPlaybackProgress = jest.fn()
  const view = render(<Player onPlaybackProgress={onPlaybackProgress} />)
  // A DOM host element, which the typings only accept as a component.
  const video = view.UNSAFE_getByType('video' as unknown as React.ComponentType)
  fireEvent(video, 'timeUpdate', {
    currentTarget: {currentTime: 1.5, duration: 42.25},
  })
  expect(onPlaybackProgress).toHaveBeenCalledWith(1.5, 42.25)
})

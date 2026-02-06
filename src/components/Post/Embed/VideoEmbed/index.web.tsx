import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {type AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a, useTheme} from '#/alf'
import {useIsWithinMessage} from '#/components/dms/MessageContext'
import {useFullscreen} from '#/components/hooks/useFullscreen'
import {ConstrainedImage} from '#/components/images/AutoSizedImage'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {
  HLSUnsupportedError,
  VideoEmbedInnerWeb,
  VideoNotFoundError,
} from '#/components/Post/Embed/VideoEmbed/VideoEmbedInner/VideoEmbedInnerWeb'
import {IS_WEB_FIREFOX} from '#/env'
import {useActiveVideoWeb} from './ActiveVideoWebContext'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

const noop = () => {}

export function VideoEmbed({embed}: {embed: AppBskyEmbedVideo.View}) {
  const t = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const {
    active: activeFromContext,
    setActive,
    sendPosition,
    currentActiveView,
  } = useActiveVideoWeb()
  const [onScreen, setOnScreen] = useState(false)
  const [isFullscreen] = useFullscreen()
  const lastKnownTime = useRef<number | undefined>(undefined)

  const isGif = embed.presentation === 'gif'
  // GIFs don't participate in the "one video at a time" system
  const active = isGif || activeFromContext

  useEffect(() => {
    if (!ref.current) return
    if (isFullscreen && !IS_WEB_FIREFOX) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        setOnScreen(entry.isIntersecting)
        // GIFs don't send position - they don't compete to be the active video
        if (!isGif) {
          sendPosition(
            entry.boundingClientRect.y + entry.boundingClientRect.height / 2,
          )
        }
      },
      {threshold: 0.5},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition, isFullscreen, isGif])

  const [key, setKey] = useState(0)
  const renderError = useCallback(
    (error: unknown) => (
      <VideoError error={error} retry={() => setKey(key + 1)} />
    ),
    [key],
  )

  let aspectRatio: number | undefined
  const dims = embed.aspectRatio
  if (dims) {
    aspectRatio = dims.width / dims.height
    if (Number.isNaN(aspectRatio)) {
      aspectRatio = undefined
    }
  }

  let constrained: number | undefined
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2 // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio)
  }

  const contents = (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flex: 1,
        cursor: 'default',
        backgroundColor: t.palette.black,
        backgroundImage: `url(${embed.thumbnail})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={evt => evt.stopPropagation()}>
      <ErrorBoundary renderError={renderError} key={key}>
        <OnlyNearScreen>
          <VideoEmbedInnerWeb
            embed={embed}
            active={active}
            setActive={setActive}
            onScreen={onScreen}
            lastKnownTime={lastKnownTime}
          />
        </OnlyNearScreen>
      </ErrorBoundary>
    </div>
  )

  return (
    <View style={[a.pt_xs]}>
      <ViewportObserver
        sendPosition={isGif ? noop : sendPosition}
        isAnyViewActive={currentActiveView !== null}>
        <ConstrainedImage
          fullBleed
          aspectRatio={constrained || 1}
          // slightly smaller max height than images
          // images use 16 / 9, for reference
          minMobileAspectRatio={14 / 9}>
          {contents}
          <MediaInsetBorder />
        </ConstrainedImage>
      </ViewportObserver>
    </View>
  )
}

const NearScreenContext = createContext(false)
NearScreenContext.displayName = 'VideoNearScreenContext'

/**
 * Renders a 100vh tall div and watches it with an IntersectionObserver to
 * send the position of the div when it's near the screen.
 *
 * IMPORTANT: ViewportObserver _must_ not be within a `overflow: hidden` container.
 */
function ViewportObserver({
  children,
  sendPosition,
  isAnyViewActive,
}: {
  children: React.ReactNode
  sendPosition: (position: number) => void
  isAnyViewActive: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [nearScreen, setNearScreen] = useState(false)
  const [isFullscreen] = useFullscreen()
  const isWithinMessage = useIsWithinMessage()

  // Send position when scrolling. This is done with an IntersectionObserver
  // observing a div of 100vh height
  useEffect(() => {
    if (!ref.current) return
    if (isFullscreen && !IS_WEB_FIREFOX) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        const position =
          entry.boundingClientRect.y + entry.boundingClientRect.height / 2
        sendPosition(position)
        setNearScreen(entry.isIntersecting)
      },
      {threshold: Array.from({length: 101}, (_, i) => i / 100)},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition, isFullscreen])

  // In case scrolling hasn't started yet, send up the position
  useEffect(() => {
    if (ref.current && !isAnyViewActive) {
      const rect = ref.current.getBoundingClientRect()
      const position = rect.y + rect.height / 2
      sendPosition(position)
    }
  }, [isAnyViewActive, sendPosition])

  return (
    <View style={[a.flex_1, a.flex_row]}>
      <NearScreenContext.Provider value={nearScreen}>
        {children}
      </NearScreenContext.Provider>
      <div
        ref={ref}
        style={{
          // Don't escape bounds when in a message
          ...(isWithinMessage
            ? {top: 0, height: '100%'}
            : {top: 'calc(50% - 50vh)', height: '100vh'}),
          position: 'absolute',
          left: '50%',
          width: 1,
          pointerEvents: 'none',
        }}
      />
    </View>
  )
}

/**
 * Awkward data flow here, but we need to hide the video when it's not near the screen.
 * But also, ViewportObserver _must_ not be within a `overflow: hidden` container.
 * So we put it at the top level of the component tree here, then hide the children of
 * the auto-resizing container.
 */
export const OnlyNearScreen = ({children}: {children: React.ReactNode}) => {
  const nearScreen = useContext(NearScreenContext)

  return nearScreen ? children : null
}

function VideoError({error, retry}: {error: unknown; retry: () => void}) {
  const {_} = useLingui()

  let showRetryButton = true
  let text = null

  if (error instanceof VideoNotFoundError) {
    text = _(msg`Video not found.`)
  } else if (error instanceof HLSUnsupportedError) {
    showRetryButton = false
    text = _(
      msg`Your browser does not support the video format. Please try a different browser.`,
    )
  } else {
    text = _(msg`An error occurred while loading the video. Please try again.`)
  }

  return (
    <VideoFallback.Container>
      <VideoFallback.Text>{text}</VideoFallback.Text>
      {showRetryButton && <VideoFallback.RetryButton onPress={retry} />}
    </VideoFallback.Container>
  )
}

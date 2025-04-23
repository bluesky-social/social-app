import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isFirefox} from '#/lib/browser'
import {ConstrainedImage} from '#/view/com/util/images/AutoSizedImage'
import {
  HLSUnsupportedError,
  VideoEmbedInnerWeb,
  VideoNotFoundError,
} from '#/view/com/util/post-embeds/VideoEmbedInner/VideoEmbedInnerWeb'
import {atoms as a} from '#/alf'
import {useIsWithinMessage} from '#/components/dms/MessageContext'
import {useFullscreen} from '#/components/hooks/useFullscreen'
import {ErrorBoundary} from '../ErrorBoundary'
import {useActiveVideoWeb} from './ActiveVideoWebContext'
import * as VideoFallback from './VideoEmbedInner/VideoFallback'

export function VideoEmbed({
  embed,
  crop,
}: {
  embed: AppBskyEmbedVideo.View
  crop?: 'none' | 'square' | 'constrained'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const {active, setActive, sendPosition, currentActiveView} =
    useActiveVideoWeb()
  const [onScreen, setOnScreen] = useState(false)
  const [isFullscreen] = useFullscreen()
  const lastKnownTime = useRef<number | undefined>()

  useEffect(() => {
    if (!ref.current) return
    if (isFullscreen && !isFirefox) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        setOnScreen(entry.isIntersecting)
        sendPosition(
          entry.boundingClientRect.y + entry.boundingClientRect.height / 2,
        )
      },
      {threshold: 0.5},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition, isFullscreen])

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
  let max: number | undefined
  if (aspectRatio !== undefined) {
    const ratio = 1 / 2 // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio)
    max = Math.max(aspectRatio, 0.25) // max of 1:4 in thread
  }
  const cropDisabled = crop === 'none'

  const contents = (
    <div
      ref={ref}
      style={{display: 'flex', flex: 1, cursor: 'default'}}
      onClick={evt => evt.stopPropagation()}>
      <ErrorBoundary renderError={renderError} key={key}>
        <ViewportObserver
          sendPosition={sendPosition}
          isAnyViewActive={currentActiveView !== null}>
          <VideoEmbedInnerWeb
            embed={embed}
            active={active}
            setActive={setActive}
            onScreen={onScreen}
            lastKnownTime={lastKnownTime}
          />
        </ViewportObserver>
      </ErrorBoundary>
    </div>
  )

  return (
    <View style={[a.pt_xs]}>
      {cropDisabled ? (
        <View style={[a.w_full, a.overflow_hidden, {aspectRatio: max ?? 1}]}>
          {contents}
        </View>
      ) : (
        <ConstrainedImage
          fullBleed={crop === 'square'}
          aspectRatio={constrained || 1}>
          {contents}
        </ConstrainedImage>
      )}
    </View>
  )
}

/**
 * Renders a 100vh tall div and watches it with an IntersectionObserver to
 * send the position of the div when it's near the screen.
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
    if (isFullscreen && !isFirefox) return
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
      {nearScreen && children}
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

import React, {useRef} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeInDown} from 'react-native-reanimated'
import {AppBskyEmbedVideo} from '@atproto/api'
import {BlueskyVideoView} from '@haileyok/bluesky-video'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_30} from '#/lib/constants'
import {clamp} from '#/lib/numbers'
import {useAutoplayDisabled} from 'state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {useIsWithinMessage} from '#/components/dms/MessageContext'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {TimeIndicator} from './TimeIndicator'

export function VideoEmbedInnerNative({
  embed,
  setStatus,
  setIsLoading,
  setIsActive,
}: {
  embed: AppBskyEmbedVideo.View
  setStatus: (status: 'playing' | 'paused') => void
  setIsLoading: (isLoading: boolean) => void
  setIsActive: (isActive: boolean) => void
}) {
  const ref = useRef<BlueskyVideoView>(null)
  const autoplayDisabled = useAutoplayDisabled()
  const isWithinMessage = useIsWithinMessage()

  const [isMuted, setIsMuted] = React.useState(true)
  const [timeRemaining, setTimeRemaining] = React.useState(0)

  const [error, setError] = React.useState<string>()
  if (error) {
    throw new Error(error)
  }

  let aspectRatio = 16 / 9

  if (embed.aspectRatio) {
    const {width, height} = embed.aspectRatio
    aspectRatio = width / height
    aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1)
  }

  return (
    <View style={[a.flex_1, a.relative, {aspectRatio}]}>
      <BlueskyVideoView
        url={embed.playlist}
        autoplay={!autoplayDisabled && !isWithinMessage}
        ref={ref}
        style={[a.flex_1, a.rounded_sm]}
        onError={e => {
          setError(e.nativeEvent.error)
        }}
        onMutedChange={e => {
          setIsMuted(e.nativeEvent.isMuted)
        }}
        onTimeRemainingChange={e => {
          setTimeRemaining(e.nativeEvent.timeRemaining)
        }}
        onStatusChange={e => {
          setStatus(e.nativeEvent.status)
        }}
        onLoadingChange={e => {
          setIsLoading(e.nativeEvent.isLoading)
        }}
        onActiveChange={e => {
          setIsActive(e.nativeEvent.isActive)
        }}
        // contentFit="cover"
        // accessibilityLabel={
        //   embed.alt ? _(msg`Video: ${embed.alt}`) : _(msg`Video`)
        // }
        // accessibilityHint=""
      />
      <VideoControls
        enterFullscreen={() => {
          ref.current?.enterFullscreen()
        }}
        toggleMuted={() => {
          ref.current?.toggleMuted()
        }}
        isMuted={isMuted}
        timeRemaining={timeRemaining}
      />
    </View>
  )
}

function VideoControls({
  enterFullscreen,
  toggleMuted,
  timeRemaining,
  isMuted,
}: {
  enterFullscreen: () => void
  toggleMuted: () => void
  timeRemaining: number
  isMuted: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  // show countdown when:
  // 1. timeRemaining is a number - was seeing NaNs
  // 2. duration is greater than 0 - means metadata has loaded
  // 3. we're less than 5 second into the video
  const showTime = !isNaN(timeRemaining)

  return (
    <View style={[a.absolute, a.inset_0]}>
      {showTime && <TimeIndicator time={timeRemaining} />}
      <Pressable
        onPress={enterFullscreen}
        style={a.flex_1}
        accessibilityLabel={_(msg`Video`)}
        accessibilityHint={_(msg`Tap to enter full screen`)}
        accessibilityRole="button"
      />
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[
          a.absolute,
          a.rounded_full,
          a.justify_center,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            paddingHorizontal: 4,
            paddingVertical: 4,
            bottom: 6,
            right: 6,
            minHeight: 21,
            minWidth: 21,
          },
        ]}>
        <Pressable
          onPress={toggleMuted}
          style={a.flex_1}
          accessibilityLabel={isMuted ? _(msg`Muted`) : _(msg`Unmuted`)}
          accessibilityHint={_(msg`Tap to toggle sound`)}
          accessibilityRole="button"
          hitSlop={HITSLOP_30}>
          {isMuted ? (
            <MuteIcon width={13} fill={t.palette.white} />
          ) : (
            <UnmuteIcon width={13} fill={t.palette.white} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  )
}

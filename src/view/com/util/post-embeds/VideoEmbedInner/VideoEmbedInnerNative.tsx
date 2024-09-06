import React, {useCallback, useRef} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeInDown} from 'react-native-reanimated'
import {VideoPlayer, VideoView} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_30} from '#/lib/constants'
import {clamp} from '#/lib/numbers'
import {useActiveVideoNative} from 'view/com/util/post-embeds/ActiveVideoNativeContext'
import {atoms as a, useTheme} from '#/alf'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {
  AudioCategory,
  PlatformInfo,
} from '../../../../../../modules/expo-bluesky-swiss-army'
import {TimeIndicator} from './TimeIndicator'

export function VideoEmbedInnerNative({
  embed,
  isFullscreen,
  setIsFullscreen,
  isMuted,
  timeRemaining,
}: {
  embed: AppBskyEmbedVideo.View
  isFullscreen: boolean
  setIsFullscreen: (isFullscreen: boolean) => void
  timeRemaining: number
  isMuted: boolean
}) {
  const {_} = useLingui()
  const {player} = useActiveVideoNative()
  const ref = useRef<VideoView>(null)

  const enterFullscreen = useCallback(() => {
    ref.current?.enterFullscreen()
  }, [])

  let aspectRatio = 16 / 9

  if (embed.aspectRatio) {
    const {width, height} = embed.aspectRatio
    aspectRatio = width / height
    aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1)
  }

  return (
    <View style={[a.flex_1, a.relative, {aspectRatio}]}>
      <VideoView
        ref={ref}
        player={player}
        style={[a.flex_1, a.rounded_sm]}
        contentFit="cover"
        nativeControls={isFullscreen}
        accessibilityIgnoresInvertColors
        onFullscreenEnter={() => {
          PlatformInfo.setAudioCategory(AudioCategory.Playback)
          PlatformInfo.setAudioActive(true)
          player.muted = false
          setIsFullscreen(true)
        }}
        onFullscreenExit={() => {
          PlatformInfo.setAudioCategory(AudioCategory.Ambient)
          PlatformInfo.setAudioActive(false)
          player.muted = true
          player.playbackRate = 1
          if (!player.playing) {
            player.play()
          }
          setIsFullscreen(false)
        }}
        accessibilityLabel={
          embed.alt ? _(msg`Video: ${embed.alt}`) : _(msg`Video`)
        }
        accessibilityHint=""
      />
      <VideoControls
        player={player}
        enterFullscreen={enterFullscreen}
        isMuted={isMuted}
        timeRemaining={timeRemaining}
      />
    </View>
  )
}

function VideoControls({
  player,
  enterFullscreen,
  timeRemaining,
  isMuted,
}: {
  player: VideoPlayer
  enterFullscreen: () => void
  timeRemaining: number
  isMuted: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  const onPressFullscreen = useCallback(() => {
    switch (player.status) {
      case 'idle':
      case 'loading':
      case 'readyToPlay': {
        if (!player.playing) player.play()
        enterFullscreen()
        break
      }
      case 'error': {
        player.replay()
        break
      }
    }
  }, [player, enterFullscreen])

  const toggleMuted = useCallback(() => {
    const muted = !player.muted
    // We want to set this to the _inverse_ of the new value, because we actually want for the audio to be mixed when
    // the video is muted, and vice versa.
    const mix = !muted
    const category = muted ? AudioCategory.Ambient : AudioCategory.Playback

    PlatformInfo.setAudioCategory(category)
    PlatformInfo.setAudioActive(mix)
    player.muted = muted
  }, [player])

  // show countdown when:
  // 1. timeRemaining is a number - was seeing NaNs
  // 2. duration is greater than 0 - means metadata has loaded
  // 3. we're less than 5 second into the video
  const showTime = !isNaN(timeRemaining)

  return (
    <View style={[a.absolute, a.inset_0]}>
      {showTime && <TimeIndicator time={timeRemaining} />}
      <Pressable
        onPress={onPressFullscreen}
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

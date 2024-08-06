import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeInDown} from 'react-native-reanimated'
import {VideoPlayer, VideoView} from 'expo-video'
import {AppBskyEmbedVideo} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused} from '@react-navigation/native'

import {HITSLOP_30} from '#/lib/constants'
import {useAppState} from '#/lib/hooks/useAppState'
import {clamp} from '#/lib/numbers'
import {logger} from '#/logger'
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
}: {
  embed: AppBskyEmbedVideo.View
}) {
  const {player} = useActiveVideoNative()
  const ref = useRef<VideoView>(null)
  const isScreenFocused = useIsFocused()
  const isAppFocused = useAppState()

  useEffect(() => {
    try {
      if (isAppFocused === 'active' && isScreenFocused && !player.playing) {
        PlatformInfo.setAudioCategory(AudioCategory.Ambient)
        PlatformInfo.setAudioActive(false)
        player.muted = true
        player.play()
      } else if (player.playing) {
        player.pause()
      }
    } catch (err) {
      logger.error(
        'Failed to play/pause while backgrounding/switching screens',
        {safeMessage: err},
      )
    }
  }, [isAppFocused, player, isScreenFocused])

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
        contentFit="contain"
        nativeControls={true}
        accessibilityIgnoresInvertColors
        onEnterFullscreen={() => {
          PlatformInfo.setAudioCategory(AudioCategory.Playback)
          PlatformInfo.setAudioActive(true)
          player.muted = false
        }}
        onExitFullscreen={() => {
          PlatformInfo.setAudioCategory(AudioCategory.Ambient)
          PlatformInfo.setAudioActive(false)
          player.muted = true
          if (!player.playing) player.play()
        }}
      />
      <VideoControls player={player} enterFullscreen={enterFullscreen} />
    </View>
  )
}

function VideoControls({
  player,
  enterFullscreen,
}: {
  player: VideoPlayer
  enterFullscreen: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [isMuted, setIsMuted] = useState(player.muted)
  const [duration, setDuration] = useState(() => Math.floor(player.duration))
  const [currentTime, setCurrentTime] = useState(() =>
    Math.floor(player.currentTime),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      // duration gets reset to 0 on loop
      if (player.duration) setDuration(Math.floor(player.duration))
      setCurrentTime(Math.floor(player.currentTime))

      // how often should we update the time?
      // 1000 gets out of sync with the video time
    }, 250)

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const sub = player.addListener('volumeChange', ({isMuted}) => {
      setIsMuted(isMuted)
    })

    return () => {
      clearInterval(interval)
      sub.remove()
    }
  }, [player])

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
  const timeRemaining = duration - currentTime
  const showTime = !isNaN(timeRemaining) && duration > 0 && currentTime <= 5

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
      {duration > 0 && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 3,
            position: 'absolute',
            bottom: 5,
            right: 5,
            minHeight: 20,
            justifyContent: 'center',
          }}>
          <Pressable
            onPress={toggleMuted}
            style={a.flex_1}
            accessibilityLabel={isMuted ? _(msg`Muted`) : _(msg`Unmuted`)}
            accessibilityHint={_(msg`Tap to toggle sound`)}
            accessibilityRole="button"
            hitSlop={HITSLOP_30}>
            {isMuted ? (
              <MuteIcon width={14} fill={t.palette.white} />
            ) : (
              <UnmuteIcon width={14} fill={t.palette.white} />
            )}
          </Pressable>
        </Animated.View>
      )}
    </View>
  )
}

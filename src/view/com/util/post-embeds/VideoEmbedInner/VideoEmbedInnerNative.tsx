import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeIn} from 'react-native-reanimated'
import {VideoPlayer, VideoView} from 'expo-video'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useIsFocused} from '@react-navigation/native'

import {HITSLOP_30} from '#/lib/constants'
import {useVideoPlayer} from '#/view/com/util/post-embeds/VideoPlayerContext'
import {android, atoms as a, useTheme} from '#/alf'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {Text} from '#/components/Typography'

export function VideoEmbedInnerNative() {
  const player = useVideoPlayer()
  const ref = useRef<VideoView>(null)
  const isScreenFocused = useIsFocused()

  // pause the video when the screen is not focused
  useEffect(() => {
    if (!isScreenFocused) {
      let wasPlaying = player.playing
      player.pause()

      return () => {
        if (wasPlaying) player.play()
      }
    }
  }, [isScreenFocused, player])

  return (
    <View style={[a.flex_1, a.relative]}>
      <VideoView
        ref={ref}
        player={player}
        style={a.flex_1}
        nativeControls={true}
      />
      <Controls
        player={player}
        enterFullscreen={() => {
          player.muted = false
          ref.current?.enterFullscreen()
        }}
      />
    </View>
  )
}

function Controls({
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

  const timeRemaining = duration - currentTime
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = String(timeRemaining % 60).padStart(2, '0')

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

  const toggleSound = useCallback(() => {
    player.muted = !player.muted
  }, [player])

  return (
    <View style={[a.absolute, a.inset_0]}>
      {!isNaN(timeRemaining) && (
        <Animated.View
          entering={FadeIn.duration(100)}
          style={[
            {
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 3,
              position: 'absolute',
              left: 5,
              bottom: 5,
              minHeight: 20,
              justifyContent: 'center',
            },
          ]}>
          <Text
            style={[
              {color: t.palette.white, fontSize: 12},
              a.font_bold,
              android({lineHeight: 1.25}),
            ]}>
            {minutes}:{seconds}
          </Text>
        </Animated.View>
      )}
      <Pressable
        onPress={enterFullscreen}
        style={a.flex_1}
        accessibilityLabel={_(msg`Video`)}
        accessibilityHint={_(msg`Tap to enter full screen`)}
        accessibilityRole="button"
      />
      <Pressable
        onPress={toggleSound}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 3,
          position: 'absolute',
          bottom: 5,
          right: 5,
          minHeight: 20,
          justifyContent: 'center',
        }}
        accessibilityLabel={isMuted ? _(msg`Muted`) : _(msg`Unmuted`)}
        accessibilityHint={_(msg`Tap to toggle sound`)}
        accessibilityRole="button"
        hitSlop={HITSLOP_30}>
        <Animated.View entering={FadeIn.duration(100)}>
          {isMuted ? (
            <MuteIcon width={14} fill={t.palette.white} />
          ) : (
            <UnmuteIcon width={14} fill={t.palette.white} />
          )}
        </Animated.View>
      </Pressable>
    </View>
  )
}

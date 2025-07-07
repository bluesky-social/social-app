import React, {useRef} from 'react'
import {Pressable, type StyleProp, View, type ViewStyle} from 'react-native'
import {type AppBskyEmbedVideo} from '@atproto/api'
import {BlueskyVideoView} from '@haileyok/bluesky-video'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_30} from '#/lib/constants'
import {useAutoplayDisabled} from '#/state/preferences'
import {atoms as a, useTheme} from '#/alf'
import {useIsWithinMessage} from '#/components/dms/MessageContext'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {Pause_Filled_Corner0_Rounded as PauseIcon} from '#/components/icons/Pause'
import {Play_Filled_Corner0_Rounded as PlayIcon} from '#/components/icons/Play'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {useVideoMuteState} from '#/components/Post/Embed/VideoEmbed/VideoVolumeContext'
import {TimeIndicator} from './TimeIndicator'

export const VideoEmbedInnerNative = React.forwardRef(
  function VideoEmbedInnerNative(
    {
      embed,
      setStatus,
      setIsLoading,
      activeState,
      setActiveState,
    }: {
      embed: AppBskyEmbedVideo.View
      setStatus: (status: 'playing' | 'paused') => void
      setIsLoading: (isLoading: boolean) => void
      activeState: 'active' | 'inactive' | 'staged'
      setActiveState: (activeState: 'active' | 'inactive' | 'staged') => void
    },
    ref: React.Ref<{togglePlayback: () => void}>,
  ) {
    const {_} = useLingui()
    const videoRef = useRef<BlueskyVideoView>(null)
    const autoplayDisabled = useAutoplayDisabled()
    const isWithinMessage = useIsWithinMessage()
    const [muted, setMuted] = useVideoMuteState()

    const [isPlaying, setIsPlaying] = React.useState(false)
    const [timeRemaining, setTimeRemaining] = React.useState(0)
    const [error, setError] = React.useState<string>()

    React.useImperativeHandle(ref, () => ({
      togglePlayback: () => {
        videoRef.current?.togglePlayback()
      },
    }))

    if (error) {
      throw new Error(error)
    }

    return (
      <View style={[a.flex_1, a.relative]}>
        <BlueskyVideoView
          url={embed.playlist}
          autoplay={!autoplayDisabled && !isWithinMessage}
          beginMuted={autoplayDisabled ? false : muted}
          style={[a.rounded_sm]}
          onActiveChange={e => {
            setActiveState(
              (
                e.nativeEvent as unknown as {
                  state: 'active' | 'inactive' | 'staged'
                }
              ).state,
            )
          }}
          onLoadingChange={e => {
            setIsLoading(e.nativeEvent.isLoading)
          }}
          onMutedChange={e => {
            setMuted(e.nativeEvent.isMuted)
          }}
          onStatusChange={e => {
            setStatus(e.nativeEvent.status)
            setIsPlaying(e.nativeEvent.status === 'playing')
          }}
          onTimeRemainingChange={e => {
            setTimeRemaining(e.nativeEvent.timeRemaining)
          }}
          onError={e => {
            setError(e.nativeEvent.error)
          }}
          ref={videoRef}
          accessibilityLabel={
            embed.alt ? _(msg`Video: ${embed.alt}`) : _(msg`Video`)
          }
          accessibilityHint=""
        />
        <VideoControls
          activeState={activeState}
          onPress={() => {
            if (activeState === 'active') {
              videoRef.current?.enterFullscreen(true)
            } else {
              videoRef.current?.togglePlayback()
            }
          }}
          toggleMuted={() => {
            videoRef.current?.toggleMuted()
          }}
          togglePlayback={() => {
            videoRef.current?.togglePlayback()
          }}
          isPlaying={isPlaying}
          timeRemaining={timeRemaining}
        />
      </View>
    )
  },
)

function VideoControls({
  activeState,
  onPress,
  toggleMuted,
  togglePlayback,
  timeRemaining,
  isPlaying,
}: {
  activeState: 'active' | 'inactive' | 'staged'
  onPress: () => void
  toggleMuted: () => void
  togglePlayback: () => void
  timeRemaining: number
  isPlaying: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [muted] = useVideoMuteState()

  // show countdown when:
  // 1. timeRemaining is a number - was seeing NaNs
  // 2. duration is greater than 0 - means metadata has loaded
  // 3. we're less than 5 second into the video
  const showTime =
    !isNaN(timeRemaining) &&
    (activeState === 'active' ? true : timeRemaining > 0)

  return (
    <View style={[a.absolute, a.inset_0]}>
      <Pressable
        onPress={onPress}
        style={a.flex_1}
        accessibilityLabel={_(msg`Video`)}
        accessibilityHint={
          activeState === 'active'
            ? _(msg`Enters full screen`)
            : _(msg`Play video`)
        }
        accessibilityRole="button"
      />
      <ControlButton
        disabled={activeState !== 'active'}
        onPress={togglePlayback}
        label={isPlaying ? _(msg`Pause`) : _(msg`Play`)}
        accessibilityHint={_(msg`Plays or pauses the video`)}
        style={{left: 6}}>
        {isPlaying ? (
          <PauseIcon width={13} fill={t.palette.white} />
        ) : (
          <PlayIcon width={13} fill={t.palette.white} />
        )}
      </ControlButton>
      {showTime && <TimeIndicator time={timeRemaining} style={{left: 33}} />}

      {activeState === 'active' && (
        <ControlButton
          onPress={toggleMuted}
          label={
            muted
              ? _(msg({message: `Unmute`, context: 'video'}))
              : _(msg({message: `Mute`, context: 'video'}))
          }
          accessibilityHint={_(msg`Toggles the sound`)}
          style={{right: 6}}>
          {muted ? (
            <MuteIcon width={13} fill={t.palette.white} />
          ) : (
            <UnmuteIcon width={13} fill={t.palette.white} />
          )}
        </ControlButton>
      )}
    </View>
  )
}

function ControlButton({
  onPress,
  children,
  label,
  accessibilityHint,
  style,
  disabled,
}: {
  onPress: () => void
  children: React.ReactNode
  label: string
  accessibilityHint: string
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}) {
  return (
    <View
      style={[
        a.absolute,
        a.rounded_full,
        a.justify_center,
        {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          paddingHorizontal: 4,
          paddingVertical: 4,
          bottom: 6,
          minHeight: 21,
          minWidth: 21,
        },
        style,
      ]}>
      <Pressable
        onPress={onPress}
        style={a.flex_1}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        hitSlop={HITSLOP_30}
        disabled={disabled}>
        {children}
      </Pressable>
    </View>
  )
}

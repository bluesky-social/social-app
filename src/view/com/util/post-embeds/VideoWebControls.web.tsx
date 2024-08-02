import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type Hls from 'hls.js'

import {
  useAutoplayDisabled,
  useSetSubtitlesEnabled,
  useSubtitlesEnabled,
} from '#/state/preferences'
import {atoms as a, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {
  ArrowsDiagonalIn_Stroke2_Corner0_Rounded as ArrowsInIcon,
  ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ArrowsOutIcon,
} from '#/components/icons/ArrowsDiagonal'
import {
  CC_Filled_Corner0_Rounded as CCActiveIcon,
  CC_Stroke2_Corner0_Rounded as CCInactiveIcon,
} from '#/components/icons/CC'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {Pause_Filled_Corner0_Rounded as PauseIcon} from '#/components/icons/Pause'
import {Play_Filled_Corner0_Rounded as PlayIcon} from '#/components/icons/Play'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function Controls({
  videoRef,
  hls,
  active,
  setActive,
  focused,
  setFocused,
  onScreen,
  enterFullscreen,
  hasSubtitleTrack,
}: {
  videoRef: React.RefObject<HTMLVideoElement>
  hls: Hls
  active: boolean
  setActive: () => void
  focused: boolean
  setFocused: (focused: boolean) => void
  onScreen: boolean
  enterFullscreen: () => void
  hasSubtitleTrack: boolean
}) {
  const {
    play,
    pause,
    playing,
    muted,
    toggleMute,
    togglePlayPause,
    currentTime,
    duration,
    buffering,
    error,
    canPlay,
  } = useVideoUtils(videoRef)
  const t = useTheme()
  const {_} = useLingui()
  const subtitlesEnabled = useSubtitlesEnabled()
  const setSubtitlesEnabled = useSetSubtitlesEnabled()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const isFullscreen = useFullscreen()
  const {state: hasFocus, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const [interactingViaKeypress, setInteractingViaKeypress] = useState(false)

  const onKeyDown = useCallback(() => {
    setInteractingViaKeypress(true)
  }, [])

  useEffect(() => {
    if (interactingViaKeypress) {
      document.addEventListener('click', () => setInteractingViaKeypress(false))
      return () => {
        document.removeEventListener('click', () =>
          setInteractingViaKeypress(false),
        )
      }
    }
  }, [interactingViaKeypress])

  // pause + unfocus when another video is active
  useEffect(() => {
    if (!active) {
      pause()
      setFocused(false)
    }
  }, [active, pause, setFocused])

  // autoplay/pause based on visibility
  const autoplayDisabled = useAutoplayDisabled()
  useEffect(() => {
    if (active && !autoplayDisabled) {
      if (onScreen) {
        play()
      } else {
        pause()
      }
    }
  }, [onScreen, pause, active, play, autoplayDisabled])

  // use minimal quality when not focused
  useEffect(() => {
    if (focused) {
      // auto decide quality based on network conditions
      hls.autoLevelCapping = -1
    } else {
      hls.autoLevelCapping = 0
    }
  }, [hls, focused])

  useEffect(() => {
    if (hasSubtitleTrack && subtitlesEnabled && canPlay) {
      hls.subtitleTrack = 0
    } else {
      hls.subtitleTrack = -1
    }
  }, [hasSubtitleTrack, subtitlesEnabled, hls, canPlay])

  // clicking on any button should focus the player, if it's not already focused
  const drawFocus = useCallback(() => {
    if (!active) {
      setActive()
    }
    setFocused(true)
  }, [active, setActive, setFocused])

  const onPressEmptySpace = useCallback(() => {
    if (!focused) {
      drawFocus()
    } else {
      togglePlayPause()
    }
  }, [togglePlayPause, drawFocus, focused])

  const onPressPlayPause = useCallback(() => {
    drawFocus()
    togglePlayPause()
  }, [drawFocus, togglePlayPause])

  const onPressSubtitles = useCallback(() => {
    drawFocus()
    setSubtitlesEnabled(!subtitlesEnabled)
  }, [drawFocus, setSubtitlesEnabled, subtitlesEnabled])

  const onPressMute = useCallback(() => {
    drawFocus()
    toggleMute()
  }, [drawFocus, toggleMute])

  const onPressFullscreen = useCallback(() => {
    drawFocus()
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [drawFocus, enterFullscreen])

  const showControls =
    (focused && !playing) || (interactingViaKeypress ? hasFocus : hovered)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={evt => {
        evt.stopPropagation()
        setInteractingViaKeypress(false)
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={_(
          focused
            ? msg`Unmute video`
            : playing
            ? msg`Pause video`
            : msg`Play video`,
        )}
        style={a.flex_1}
        onPress={onPressEmptySpace}
      />
      <View
        style={[
          a.flex_shrink_0,
          a.w_full,
          a.px_sm,
          a.pt_sm,
          a.pb_md,
          a.gap_md,
          a.flex_row,
          a.align_center,
          web({
            background:
              'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
          }),
          showControls ? {opacity: 1} : {opacity: 0},
        ]}>
        <Button
          label={_(playing ? msg`Pause` : msg`Play`)}
          onPress={onPressPlayPause}
          {...btnProps}>
          {playing ? (
            <PauseIcon fill={t.palette.white} width={20} />
          ) : (
            <PlayIcon fill={t.palette.white} width={20} />
          )}
        </Button>
        <View style={a.flex_1} />
        <Text style={{color: t.palette.white}}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
        {hasSubtitleTrack && (
          <Button
            label={_(
              subtitlesEnabled ? msg`Disable subtitles` : msg`Enable subtitles`,
            )}
            onPress={onPressSubtitles}
            {...btnProps}>
            {subtitlesEnabled ? (
              <CCActiveIcon fill={t.palette.white} width={20} />
            ) : (
              <CCInactiveIcon fill={t.palette.white} width={20} />
            )}
          </Button>
        )}
        <Button
          label={_(muted ? msg`Unmute` : msg`Mute`)}
          onPress={onPressMute}
          {...btnProps}>
          {muted ? (
            <MuteIcon fill={t.palette.white} width={20} />
          ) : (
            <UnmuteIcon fill={t.palette.white} width={20} />
          )}
        </Button>
        {/* TODO: find workaround for iOS Safari */}
        <Button
          label={_(muted ? msg`Unmute` : msg`Mute`)}
          onPress={onPressFullscreen}
          {...btnProps}>
          {isFullscreen ? (
            <ArrowsInIcon fill={t.palette.white} width={20} />
          ) : (
            <ArrowsOutIcon fill={t.palette.white} width={20} />
          )}
        </Button>
      </View>
      {(showControls || !focused) && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            a.absolute,
            {
              height: 5,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(255,255,255,0.4)',
            },
          ]}>
          {duration > 0 && (
            <View
              style={[
                a.h_full,
                a.mr_auto,
                {
                  backgroundColor: t.palette.white,
                  width: `${(currentTime / duration) * 100}%`,
                  opacity: 0.8,
                },
              ]}
            />
          )}
        </Animated.View>
      )}
      {(buffering || error) && (
        <Animated.View
          pointerEvents="none"
          entering={FadeIn.delay(1000).duration(200)}
          exiting={FadeOut.duration(200)}
          style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
          {buffering && <Loader fill={t.palette.white} size="lg" />}
          {error && (
            <Text style={{color: t.palette.white}}>
              <Trans>An error occurred</Trans>
            </Text>
          )}
        </Animated.View>
      )}
    </div>
  )
}

const btnProps = {
  variant: 'ghost',
  shape: 'round',
  size: 'medium',
  style: a.p_2xs,
  hoverStyle: {backgroundColor: 'rgba(255, 255, 255, 0.1)'},
} as const

function formatTime(time: number) {
  if (isNaN(time)) {
    return '--'
  }

  time = Math.round(time)

  const minutes = Math.floor(time / 60)
  const seconds = String(time % 60).padStart(2, '0')

  return `${minutes}:${seconds}`
}

function useVideoUtils(ref: React.RefObject<HTMLVideoElement>) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const playWhenReadyRef = useRef(false)

  useEffect(() => {
    if (!ref.current) return
    let current = ref.current

    function round(num: number) {
      return Math.round(num * 100) / 100
    }

    // Initial values
    setCurrentTime(round(current.currentTime) || 0)
    setDuration(round(current.duration) || 0)
    setMuted(current.muted)
    setPlaying(!current.paused)

    const handleTimeUpdate = () => {
      if (!current) return
      setCurrentTime(round(current.currentTime) || 0)
    }

    const handleDurationChange = () => {
      if (!current) return
      setDuration(round(current.duration) || 0)
    }

    const handlePlay = () => {
      setPlaying(true)
    }

    const handlePause = () => {
      setPlaying(false)
    }

    const handleVolumeChange = () => {
      if (!current) return
      setMuted(current.muted)
    }

    const handleError = () => {
      setError(true)
    }

    const handleCanPlay = () => {
      setBuffering(false)
      setCanPlay(true)

      if (!current) return
      if (playWhenReadyRef.current) {
        current.play()
        playWhenReadyRef.current = false
      }
    }

    const handleCanPlayThrough = () => {
      setBuffering(false)
    }

    const handleWaiting = () => {
      setBuffering(true)
    }

    const handlePlaying = () => {
      setError(false)
      setBuffering(false)
    }

    const handleSeeking = () => {
      setBuffering(true)
    }

    const handleSeeked = () => {
      setError(false)
      setBuffering(false)
    }

    const handleStalled = () => {
      setBuffering(true)
    }

    const handleEnded = () => {
      setError(false)
      setBuffering(false)
      setPlaying(false)
    }

    ref.current.addEventListener('timeupdate', handleTimeUpdate)
    ref.current.addEventListener('durationchange', handleDurationChange)
    ref.current.addEventListener('play', handlePlay)
    ref.current.addEventListener('pause', handlePause)
    ref.current.addEventListener('volumechange', handleVolumeChange)
    ref.current.addEventListener('ended', handlePause)
    ref.current.addEventListener('error', handleError)
    ref.current.addEventListener('canplay', handleCanPlay)
    ref.current.addEventListener('canplaythrough', handleCanPlayThrough)
    ref.current.addEventListener('waiting', handleWaiting)
    ref.current.addEventListener('playing', handlePlaying)
    ref.current.addEventListener('seeking', handleSeeking)
    ref.current.addEventListener('seeked', handleSeeked)
    ref.current.addEventListener('stalled', handleStalled)
    ref.current.addEventListener('ended', handleEnded)

    return () => {
      current.removeEventListener('timeupdate', handleTimeUpdate)
      current.removeEventListener('durationchange', handleDurationChange)
      current.removeEventListener('play', handlePlay)
      current.removeEventListener('pause', handlePause)
      current.removeEventListener('volumechange', handleVolumeChange)
      current.removeEventListener('ended', handlePause)
      current.removeEventListener('error', handleError)
      current.removeEventListener('canplay', handleCanPlay)
      current.removeEventListener('canplaythrough', handleCanPlayThrough)
      current.removeEventListener('waiting', handleWaiting)
      current.removeEventListener('playing', handlePlaying)
      current.removeEventListener('seeking', handleSeeking)
      current.removeEventListener('seeked', handleSeeked)
      current.removeEventListener('stalled', handleStalled)
      current.removeEventListener('ended', handleEnded)
    }
  }, [ref])

  const play = useCallback(() => {
    if (!ref.current) return

    if (ref.current.ended) {
      ref.current.currentTime = 0
    }

    if (ref.current.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      playWhenReadyRef.current = true
    } else {
      const promise = ref.current.play()
      if (promise !== undefined) {
        promise.catch(err => {
          console.error('Error playing video:', err)
        })
      }
    }
  }, [ref])

  const pause = useCallback(() => {
    if (!ref.current) return

    ref.current.pause()
  }, [ref])

  const togglePlayPause = useCallback(() => {
    if (!ref.current) return

    if (ref.current.paused) {
      play()
    } else {
      pause()
    }
  }, [ref, play, pause])

  const mute = useCallback(() => {
    if (!ref.current) return

    ref.current.muted = true
  }, [ref])

  const unmute = useCallback(() => {
    if (!ref.current) return

    ref.current.muted = false
  }, [ref])

  const toggleMute = useCallback(() => {
    if (!ref.current) return

    ref.current.muted = !ref.current.muted
  }, [ref])

  return {
    play,
    pause,
    togglePlayPause,
    duration,
    currentTime,
    playing,
    muted,
    mute,
    unmute,
    toggleMute,
    buffering,
    error,
    canPlay,
  }
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement),
  )

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return isFullscreen
}

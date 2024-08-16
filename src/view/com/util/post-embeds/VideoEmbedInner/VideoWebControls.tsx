import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type Hls from 'hls.js'

import {isIPhoneWeb} from 'platform/detection'
import {
  useAutoplayDisabled,
  useSetSubtitlesEnabled,
  useSubtitlesEnabled,
} from 'state/preferences'
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
  hlsRef,
  active,
  setActive,
  focused,
  setFocused,
  onScreen,
  fullscreenRef,
  hasSubtitleTrack,
}: {
  videoRef: React.RefObject<HTMLVideoElement>
  hlsRef: React.RefObject<Hls | undefined>
  active: boolean
  setActive: () => void
  focused: boolean
  setFocused: (focused: boolean) => void
  onScreen: boolean
  fullscreenRef: React.RefObject<HTMLDivElement>
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
  const [isFullscreen, toggleFullscreen] = useFullscreen(fullscreenRef)
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
    if (!hlsRef.current) return
    if (focused) {
      // auto decide quality based on network conditions
      hlsRef.current.autoLevelCapping = -1
    } else {
      hlsRef.current.autoLevelCapping = 0
    }
  }, [hlsRef, focused])

  useEffect(() => {
    if (!hlsRef.current) return
    if (hasSubtitleTrack && subtitlesEnabled && canPlay) {
      hlsRef.current.subtitleTrack = 0
    } else {
      hlsRef.current.subtitleTrack = -1
    }
  }, [hasSubtitleTrack, subtitlesEnabled, hlsRef, canPlay])

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
    toggleFullscreen()
  }, [drawFocus, toggleFullscreen])

  const onSeek = useCallback(
    (time: number) => {
      if (!videoRef.current) return
      if (videoRef.current.fastSeek) {
        videoRef.current.fastSeek(time)
      } else {
        videoRef.current.currentTime = time
      }
    },
    [videoRef],
  )

  const [playStateBeforeSeek, setPlayStateBeforeSeek] = useState(false)

  const onSeekStart = useCallback(() => {
    drawFocus()
    setPlayStateBeforeSeek(playing)
    pause()
  }, [playing, pause, drawFocus])

  const onSeekEnd = useCallback(() => {
    if (playStateBeforeSeek) {
      play()
    }
  }, [playStateBeforeSeek, play])

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
          a.px_xs,
          web({
            background:
              'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
          }),
          {
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          },
        ]}>
        <Scrubber
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
          onSeekStart={onSeekStart}
          onSeekEnd={onSeekEnd}
        />
        <View
          style={[
            a.flex_1,
            a.px_xs,
            a.pt_sm,
            a.pb_md,
            a.gap_md,
            a.flex_row,
            a.align_center,
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
                subtitlesEnabled
                  ? msg`Disable subtitles`
                  : msg`Enable subtitles`,
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
          {!isIPhoneWeb && (
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
          )}
        </View>
      </View>
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

function Scrubber({
  duration,
  currentTime,
  onSeek,
  onSeekEnd,
  onSeekStart,
}: {
  duration: number
  currentTime: number
  onSeek: (time: number) => void
  onSeekEnd: () => void
  onSeekStart: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {
    state: scrubbing,
    onIn: startScrubbing,
    onOut: stopScrubbing,
  } = useInteractionState()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const [seekPosition, setSeekPosition] = useState(0)
  const isSeekingRef = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function seek(evt: MouseEvent | TouchEvent) {
      if (!ref.current) return
      const {left, width} = ref.current.getBoundingClientRect()
      const x = 'touches' in evt ? evt.touches[0].clientX : evt.clientX
      const percent = Math.min(1, Math.max(0, (x - left) / width)) * duration
      onSeek(percent)
      setSeekPosition(percent)
    }

    // Handle mousedown and touchstart on the specific element
    const handleMouseDown = (evt: MouseEvent | TouchEvent) => {
      if (!ref.current) return
      const target = evt.target as Node | null
      if (ref.current.contains(target)) {
        evt.preventDefault()
        isSeekingRef.current = true
        seek(evt)
        onSeekStart()
        startScrubbing()
      }
    }

    // Handle mouseup and touchend anywhere on the document
    const handleMouseUp = (evt: MouseEvent | TouchEvent) => {
      if (isSeekingRef.current) {
        evt.preventDefault()
        isSeekingRef.current = false
        onSeekEnd()
        stopScrubbing()
      }
    }

    // Log the horizontal mouse position on mousemove and touchmove
    const handleMouseMove = (evt: MouseEvent | TouchEvent) => {
      if (isSeekingRef.current) {
        evt.preventDefault()
        seek(evt)
      }
    }

    const abortController = new AbortController()
    const {signal} = abortController

    document.addEventListener('mousedown', handleMouseDown, {signal})
    document.addEventListener('mouseup', handleMouseUp, {signal})
    document.addEventListener('mousemove', handleMouseMove, {signal})
    document.addEventListener('touchstart', handleMouseDown, {signal})
    document.addEventListener('touchend', handleMouseUp, {signal})
    document.addEventListener('touchmove', handleMouseMove, {signal})

    return () => {
      abortController.abort()
    }
  }, [onSeekEnd, onSeekStart, startScrubbing, stopScrubbing, onSeek, duration])

  const progress = scrubbing ? seekPosition : currentTime
  const progressPercent = (progress / duration) * 100

  return (
    <View
      testID="scrubber"
      style={[{height: 10, width: '100%'}, a.flex_shrink_0, a.px_xs]}
      // @ts-expect-error web only -sfn
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      <div
        ref={ref}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          cursor: 'pointer',
        }}>
        <View
          style={[
            a.w_full,
            a.rounded_full,
            a.overflow_hidden,
            {backgroundColor: 'rgba(255, 255, 255, 0.4)'},
            {height: hovered ? 6 : 3},
          ]}>
          {currentTime && duration && (
            <View
              style={[
                a.h_full,
                {backgroundColor: t.palette.white},
                {width: `${progressPercent}%`},
              ]}
            />
          )}
        </View>
        <div
          aria-label="Seek slider"
          role="slider"
          aria-valuemax={duration}
          aria-valuemin={0}
          aria-valuenow={currentTime}
          aria-valuetext={_(
            msg`${formatTime(currentTime)} of ${formatTime(duration)}`,
          )}
          tabIndex={0}
          style={{
            position: 'absolute',
            height: 16,
            width: 16,
            left: `calc(${progressPercent}% - 8px)`,
            borderRadius: 8,
          }}>
          <View
            pointerEvents="none"
            style={[
              a.w_full,
              a.h_full,
              a.rounded_full,
              {backgroundColor: t.palette.white},
              {
                transform: [
                  {scale: hovered || scrubbing ? (scrubbing ? 1 : 0.6) : 0},
                ],
              },
            ]}
          />
        </div>
      </div>
    </View>
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

    let bufferingTimeout: ReturnType<typeof setTimeout> | undefined

    function round(num: number) {
      return Math.round(num * 100) / 100
    }

    // Initial values
    setCurrentTime(round(ref.current.currentTime) || 0)
    setDuration(round(ref.current.duration) || 0)
    setMuted(ref.current.muted)
    setPlaying(!ref.current.paused)

    const handleTimeUpdate = () => {
      if (!ref.current) return
      setCurrentTime(round(ref.current.currentTime) || 0)
    }

    const handleDurationChange = () => {
      if (!ref.current) return
      setDuration(round(ref.current.duration) || 0)
    }

    const handlePlay = () => {
      setPlaying(true)
    }

    const handlePause = () => {
      setPlaying(false)
    }

    const handleVolumeChange = () => {
      if (!ref.current) return
      setMuted(ref.current.muted)
    }

    const handleError = () => {
      setError(true)
    }

    const handleCanPlay = () => {
      setBuffering(false)
      setCanPlay(true)

      if (!ref.current) return
      if (playWhenReadyRef.current) {
        ref.current.play()
        playWhenReadyRef.current = false
      }
    }

    const handleCanPlayThrough = () => {
      setBuffering(false)
    }

    const handleWaiting = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      bufferingTimeout = setTimeout(() => {
        setBuffering(true)
      }, 200) // Delay to avoid frequent buffering state changes
    }

    const handlePlaying = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      setBuffering(false)
      setError(false)
    }

    const handleSeeking = () => {
      setBuffering(true)
    }

    const handleSeeked = () => {
      setBuffering(false)
    }

    const handleStalled = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      bufferingTimeout = setTimeout(() => {
        setBuffering(true)
      }, 200) // Delay to avoid frequent buffering state changes
    }

    const handleEnded = () => {
      setPlaying(false)
      setBuffering(false)
      setError(false)
    }

    const abortController = new AbortController()

    ref.current.addEventListener('timeupdate', handleTimeUpdate, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('durationchange', handleDurationChange, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('play', handlePlay, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('pause', handlePause, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('volumechange', handleVolumeChange, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('error', handleError, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('canplay', handleCanPlay, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('canplaythrough', handleCanPlayThrough, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('waiting', handleWaiting, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('playing', handlePlaying, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('seeking', handleSeeking, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('seeked', handleSeeked, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('stalled', handleStalled, {
      signal: abortController.signal,
    })
    ref.current.addEventListener('ended', handleEnded, {
      signal: abortController.signal,
    })

    return () => {
      abortController.abort()
      clearTimeout(bufferingTimeout)
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
    playWhenReadyRef.current = false
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

function fullscreenSubscribe(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange)
  return () => document.removeEventListener('fullscreenchange', onChange)
}

function useFullscreen(ref: React.RefObject<HTMLElement>) {
  const isFullscreen = useSyncExternalStore(fullscreenSubscribe, () =>
    Boolean(document.fullscreenElement),
  )

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      if (!ref.current) return
      ref.current.requestFullscreen()
    }
  }, [isFullscreen, ref])

  return [isFullscreen, toggleFullscreen] as const
}

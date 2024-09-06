import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {Pressable, View} from 'react-native'
import {SvgProps} from 'react-native-svg'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type Hls from 'hls.js'

import {isFirefox} from '#/lib/browser'
import {clamp} from '#/lib/numbers'
import {isIPhoneWeb} from '#/platform/detection'
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
import {TimeIndicator} from './TimeIndicator'

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
    onIn: onHover,
    onOut: onEndHover,
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
    if (active) {
      if (onScreen) {
        if (!autoplayDisabled) play()
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
      if (autoplayDisabled) play()
    } else {
      togglePlayPause()
    }
  }, [togglePlayPause, drawFocus, focused, autoplayDisabled, play])

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

  const playStateBeforeSeekRef = useRef(false)

  const onSeekStart = useCallback(() => {
    drawFocus()
    playStateBeforeSeekRef.current = playing
    pause()
  }, [playing, pause, drawFocus])

  const onSeekEnd = useCallback(() => {
    if (playStateBeforeSeekRef.current) {
      play()
    }
  }, [play])

  const seekLeft = useCallback(() => {
    if (!videoRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const currentTime = videoRef.current.currentTime
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const duration = videoRef.current.duration || 0
    onSeek(clamp(currentTime - 5, 0, duration))
  }, [onSeek, videoRef])

  const seekRight = useCallback(() => {
    if (!videoRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const currentTime = videoRef.current.currentTime
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const duration = videoRef.current.duration || 0
    onSeek(clamp(currentTime + 5, 0, duration))
  }, [onSeek, videoRef])

  const [showCursor, setShowCursor] = useState(true)
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const onPointerMoveEmptySpace = useCallback(() => {
    setShowCursor(true)
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current)
    }
    cursorTimeoutRef.current = setTimeout(() => {
      setShowCursor(false)
      onEndHover()
    }, 2000)
  }, [onEndHover])
  const onPointerLeaveEmptySpace = useCallback(() => {
    setShowCursor(false)
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current)
    }
  }, [])

  const showControls =
    ((focused || autoplayDisabled) && !playing) ||
    (interactingViaKeypress ? hasFocus : hovered)

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
      onPointerEnter={onHover}
      onPointerMove={onHover}
      onPointerLeave={onEndHover}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}>
      <Pressable
        accessibilityRole="button"
        onPointerEnter={onPointerMoveEmptySpace}
        onPointerMove={onPointerMoveEmptySpace}
        onPointerLeave={onPointerLeaveEmptySpace}
        accessibilityHint={_(
          !focused
            ? msg`Unmute video`
            : playing
            ? msg`Pause video`
            : msg`Play video`,
        )}
        style={[
          a.flex_1,
          web({cursor: showCursor || !playing ? 'pointer' : 'none'}),
        ]}
        onPress={onPressEmptySpace}
      />
      {!showControls && !focused && duration > 0 && (
        <TimeIndicator time={Math.floor(duration - currentTime)} />
      )}
      <View
        style={[
          a.flex_shrink_0,
          a.w_full,
          a.px_xs,
          web({
            background:
              'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
          }),
          {opacity: showControls ? 1 : 0},
          {transition: 'opacity 0.2s ease-in-out'},
        ]}>
        <Scrubber
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
          onSeekStart={onSeekStart}
          onSeekEnd={onSeekEnd}
          seekLeft={seekLeft}
          seekRight={seekRight}
          togglePlayPause={togglePlayPause}
          drawFocus={drawFocus}
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
          <ControlButton
            active={playing}
            activeLabel={_(msg`Pause`)}
            inactiveLabel={_(msg`Play`)}
            activeIcon={PauseIcon}
            inactiveIcon={PlayIcon}
            onPress={onPressPlayPause}
          />
          <View style={a.flex_1} />
          <Text style={{color: t.palette.white}}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
          {hasSubtitleTrack && (
            <ControlButton
              active={subtitlesEnabled}
              activeLabel={_(msg`Disable subtitles`)}
              inactiveLabel={_(msg`Enable subtitles`)}
              activeIcon={CCActiveIcon}
              inactiveIcon={CCInactiveIcon}
              onPress={onPressSubtitles}
            />
          )}
          <ControlButton
            active={muted}
            activeLabel={_(msg`Unmute`)}
            inactiveLabel={_(msg`Mute`)}
            activeIcon={MuteIcon}
            inactiveIcon={UnmuteIcon}
            onPress={onPressMute}
          />
          {!isIPhoneWeb && (
            <ControlButton
              active={isFullscreen}
              activeLabel={_(msg`Exit fullscreen`)}
              inactiveLabel={_(msg`Fullscreen`)}
              activeIcon={ArrowsInIcon}
              inactiveIcon={ArrowsOutIcon}
              onPress={onPressFullscreen}
            />
          )}
        </View>
      </View>
      {(buffering || error) && (
        <View
          pointerEvents="none"
          style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
          {buffering && <Loader fill={t.palette.white} size="lg" />}
          {error && (
            <Text style={{color: t.palette.white}}>
              <Trans>An error occurred</Trans>
            </Text>
          )}
        </View>
      )}
    </div>
  )
}

function ControlButton({
  active,
  activeLabel,
  inactiveLabel,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
  onPress,
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  activeIcon: React.ComponentType<Pick<SvgProps, 'fill' | 'width'>>
  inactiveIcon: React.ComponentType<Pick<SvgProps, 'fill' | 'width'>>
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <Button
      label={active ? activeLabel : inactiveLabel}
      onPress={onPress}
      variant="ghost"
      shape="round"
      size="medium"
      style={a.p_2xs}
      hoverStyle={{backgroundColor: 'rgba(255, 255, 255, 0.1)'}}>
      {active ? (
        <ActiveIcon fill={t.palette.white} width={20} />
      ) : (
        <InactiveIcon fill={t.palette.white} width={20} />
      )}
    </Button>
  )
}

function Scrubber({
  duration,
  currentTime,
  onSeek,
  onSeekEnd,
  onSeekStart,
  seekLeft,
  seekRight,
  togglePlayPause,
  drawFocus,
}: {
  duration: number
  currentTime: number
  onSeek: (time: number) => void
  onSeekEnd: () => void
  onSeekStart: () => void
  seekLeft: () => void
  seekRight: () => void
  togglePlayPause: () => void
  drawFocus: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [scrubberActive, setScrubberActive] = useState(false)
  const {
    state: hovered,
    onIn: onStartHover,
    onOut: onEndHover,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const [seekPosition, setSeekPosition] = useState(0)
  const isSeekingRef = useRef(false)
  const barRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)

  const seek = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      if (!barRef.current) return
      const {left, width} = barRef.current.getBoundingClientRect()
      const x = evt.clientX
      const percent = clamp((x - left) / width, 0, 1) * duration
      onSeek(percent)
      setSeekPosition(percent)
    },
    [duration, onSeek],
  )

  const onPointerDown = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      const target = evt.target
      if (target instanceof Element) {
        evt.preventDefault()
        target.setPointerCapture(evt.pointerId)
        isSeekingRef.current = true
        seek(evt)
        setScrubberActive(true)
        onSeekStart()
      }
    },
    [seek, onSeekStart],
  )

  const onPointerMove = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      if (isSeekingRef.current) {
        evt.preventDefault()
        seek(evt)
      }
    },
    [seek],
  )

  const onPointerUp = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      const target = evt.target
      if (isSeekingRef.current && target instanceof Element) {
        evt.preventDefault()
        target.releasePointerCapture(evt.pointerId)
        isSeekingRef.current = false
        onSeekEnd()
        setScrubberActive(false)
      }
    },
    [onSeekEnd],
  )

  useEffect(() => {
    // HACK: there's divergent browser behaviour about what to do when
    // a pointerUp event is fired outside the element that captured the
    // pointer. Firefox clicks on the element the mouse is over, so we have
    // to make everything unclickable while seeking -sfn
    if (isFirefox && scrubberActive) {
      document.body.classList.add('force-no-clicks')

      return () => {
        document.body.classList.remove('force-no-clicks')
      }
    }
  }, [scrubberActive, onSeekEnd])

  useEffect(() => {
    if (!circleRef.current) return
    if (focused) {
      const abortController = new AbortController()
      const {signal} = abortController
      circleRef.current.addEventListener(
        'keydown',
        evt => {
          // space: play/pause
          // arrow left: seek backward
          // arrow right: seek forward

          if (evt.key === ' ') {
            evt.preventDefault()
            drawFocus()
            togglePlayPause()
          } else if (evt.key === 'ArrowLeft') {
            evt.preventDefault()
            drawFocus()
            seekLeft()
          } else if (evt.key === 'ArrowRight') {
            evt.preventDefault()
            drawFocus()
            seekRight()
          }
        },
        {signal},
      )

      return () => abortController.abort()
    }
  }, [focused, seekLeft, seekRight, togglePlayPause, drawFocus])

  const progress = scrubberActive ? seekPosition : currentTime
  const progressPercent = (progress / duration) * 100

  return (
    <View
      testID="scrubber"
      style={[{height: 10, width: '100%'}, a.flex_shrink_0, a.px_xs]}
      onPointerEnter={onStartHover}
      onPointerLeave={onEndHover}>
      <div
        ref={barRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          cursor: scrubberActive ? 'grabbing' : 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}>
        <View
          style={[
            a.w_full,
            a.rounded_full,
            a.overflow_hidden,
            {backgroundColor: 'rgba(255, 255, 255, 0.4)'},
            {height: hovered || scrubberActive ? 6 : 3},
          ]}>
          {duration > 0 && (
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
          ref={circleRef}
          aria-label={_(msg`Seek slider`)}
          role="slider"
          aria-valuemax={duration}
          aria-valuemin={0}
          aria-valuenow={currentTime}
          aria-valuetext={_(
            msg`${formatTime(currentTime)} of ${formatTime(duration)}`,
          )}
          tabIndex={0}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            position: 'absolute',
            height: 16,
            width: 16,
            left: `calc(${progressPercent}% - 8px)`,
            borderRadius: 8,
            pointerEvents: 'none',
          }}>
          <View
            style={[
              a.w_full,
              a.h_full,
              a.rounded_full,
              {backgroundColor: t.palette.white},
              {
                transform: [
                  {
                    scale:
                      hovered || scrubberActive || focused
                        ? scrubberActive
                          ? 1
                          : 0.6
                        : 0,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
    </View>
  )
}

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

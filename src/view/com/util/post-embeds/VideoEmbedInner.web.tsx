import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import Hls from 'hls.js'

import {atoms as a, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {
  ArrowsDiagonalIn_Stroke2_Corner0_Rounded as ArrowsInIcon,
  ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ArrowsOutIcon,
} from '#/components/icons/ArrowsDiagonal'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {Pause_Filled_Corner0_Rounded as PauseIcon} from '#/components/icons/Pause'
import {Play_Filled_Corner0_Rounded as PlayIcon} from '#/components/icons/Play'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {Text} from '#/components/Typography'

export function VideoEmbedInner({
  active,
  sendPosition,
  isAnyViewActive,
  ...props
}: {
  source: string
  active: boolean
  setActive: () => void
  sendPosition: (position: number) => void
  onScreen: boolean
  isAnyViewActive?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Send position when scrolling. This is done with an IntersectionObserver
  // observing a div of 100vh height
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        const position =
          entry.boundingClientRect.y + entry.boundingClientRect.height / 2
        sendPosition(position)
      },
      {threshold: Array.from({length: 101}, (_, i) => i / 100)},
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [sendPosition])

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
      <VideoPlayer active={active} {...props} />
      <div
        ref={ref}
        style={{
          position: 'absolute',
          top: 'calc(50% - 50vh)',
          left: '50%',
          height: '100vh',
          width: 1,
          pointerEvents: 'none',
        }}
      />
    </View>
  )
}

export function VideoPlayer({
  source,
  active,
  setActive,
  onScreen,
}: {
  source: string
  active: boolean
  setActive: () => void
  onScreen: boolean
}) {
  const [hls] = useState(() => new Hls())
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (
      ref.current &&
      !ref.current.canPlayType('application/vnd.apple.mpegurl') &&
      Hls.isSupported()
    ) {
      hls.attachMedia(ref.current)

      return () => {
        hls.detachMedia()
      }
    }
  }, [hls])

  useEffect(() => {
    if (ref.current) {
      if (ref.current.canPlayType('application/vnd.apple.mpegurl')) {
        ref.current.src = source
      } else if (Hls.isSupported()) {
        hls.loadSource(source)
      } else {
        // TODO: fallback
      }
    }
  }, [source, hls])

  const enterFullscreen = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen()
    }
  }, [])

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        // TODO: get from embed metadata
        // max should be 1 / 1
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
      ]}>
      <div
        ref={containerRef}
        style={{width: '100%', height: '100%', display: 'flex'}}>
        <Controls
          videoRef={ref}
          active={active}
          setActive={setActive}
          focused={focused}
          setFocused={setFocused}
          onScreen={onScreen}
          enterFullscreen={enterFullscreen}
        />
        <video
          ref={ref}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
          playsInline
          preload="none"
          loop
          muted={!focused}
        />
      </div>
    </View>
  )
}

function Controls({
  videoRef,
  active,
  setActive,
  focused,
  setFocused,
  onScreen,
  enterFullscreen,
}: {
  videoRef: React.RefObject<HTMLVideoElement>
  active: boolean
  setActive: () => void
  focused: boolean
  setFocused: (focused: boolean) => void
  onScreen: boolean
  enterFullscreen: () => void
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
  } = useVideoUtils(videoRef)
  const t = useTheme()
  const {_} = useLingui()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const isFullscreen = useFullscreen()
  const {state: hasFocus, onIn: onFocus, onOut: onBlur} = useInteractionState()

  useEffect(() => {
    if (active) {
      play()
    }
    return () => {
      pause()
      setFocused(false)
    }
  }, [active, play, pause, setFocused])

  useEffect(() => {
    if (!onScreen) {
      pause()
    }
  }, [onScreen, pause])

  const onPressPlayPause = useCallback(() => {
    if (!focused) {
      if (!active) {
        setActive()
      }
      setFocused(true)
    } else {
      togglePlayPause()
    }
  }, [togglePlayPause, setActive, setFocused, active, focused])

  const showControls = hovered || hasFocus || !playing

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={_(
          focused
            ? msg`Unmute video`
            : playing
            ? msg`Pause video`
            : msg`Play video`,
        )}
        style={[a.flex_1]}
        onPress={onPressPlayPause}
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
              'linear-gradient(rgba(0, 0, 0, 0),  rgba(0, 0, 0, 0.4))',
          }),
          showControls ? {opacity: 1} : {opacity: 0},
        ]}>
        <Button
          label={_(playing ? msg`Pause` : msg`Play`)}
          onPress={onPressPlayPause}
          variant="ghost"
          shape="round"
          size="medium">
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
        <Button
          label={_(muted ? msg`Unmute` : msg`Mute`)}
          onPress={() => {
            if (!active) {
              setActive()
            }
            setFocused(true)
            toggleMute()
          }}
          variant="ghost"
          shape="round"
          size="medium">
          {muted ? (
            <MuteIcon fill={t.palette.white} width={20} />
          ) : (
            <UnmuteIcon fill={t.palette.white} width={20} />
          )}
        </Button>
        {/* TODO: find workaround for iOS Safari */}
        <Button
          label={_(muted ? msg`Unmute` : msg`Mute`)}
          onPress={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              enterFullscreen()
            }
          }}
          variant="ghost"
          shape="round"
          size="medium">
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
    </div>
  )
}

function formatTime(time: number) {
  if (isNaN(time)) {
    return '--'
  }

  const minutes = Math.floor(time / 60)
  const seconds = String(time % 60).padStart(2, '0')

  return `${minutes}:${seconds}`
}

function useVideoUtils(ref: React.RefObject<HTMLVideoElement>) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const playWhenReadyRef = useRef(false)

  useEffect(() => {
    if (!ref.current) return
    let current = ref.current

    // Initial values
    setCurrentTime(Math.round(current.currentTime) || 0)
    setDuration(Math.round(current.duration) || 0)
    setMuted(current.muted)
    setPlaying(!current.paused)

    const handleTimeUpdate = () => {
      if (!current) return
      setCurrentTime(Math.round(current.currentTime) || 0)
    }

    const handleDurationChange = () => {
      if (!current) return
      setDuration(Math.round(current.duration) || 0)
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

    const handleCanPlay = () => {
      if (!current) return
      if (playWhenReadyRef.current) {
        current.play()
        playWhenReadyRef.current = false
      }
    }

    ref.current.addEventListener('timeupdate', handleTimeUpdate)
    ref.current.addEventListener('durationchange', handleDurationChange)
    ref.current.addEventListener('play', handlePlay)
    ref.current.addEventListener('pause', handlePause)
    ref.current.addEventListener('volumechange', handleVolumeChange)
    ref.current.addEventListener('ended', handlePause)
    ref.current.addEventListener('error', handlePause)
    ref.current.addEventListener('canplay', handleCanPlay)

    return () => {
      current.removeEventListener('timeupdate', handleTimeUpdate)
      current.removeEventListener('durationchange', handleDurationChange)
      current.removeEventListener('play', handlePlay)
      current.removeEventListener('pause', handlePause)
      current.removeEventListener('volumechange', handleVolumeChange)
      current.removeEventListener('ended', handlePause)
      current.removeEventListener('error', handlePause)
      current.removeEventListener('canplay', handleCanPlay)
    }
  }, [ref])

  const play = useCallback(() => {
    if (!ref.current) return

    if (ref.current.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      playWhenReadyRef.current = true
    } else {
      const promise = ref.current.play()
      if (promise !== undefined) {
        promise.catch(error => {
          console.error('Error playing video:', error)
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

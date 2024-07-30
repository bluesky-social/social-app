import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import Hls from 'hls.js'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowsDiagonalOut_Stroke2_Corner2_Rounded as FullscreenIcon} from '#/components/icons/ArrowsDiagonal'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {Pause_Filled_Corner0_Rounded as PauseIcon} from '#/components/icons/Pause'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'

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
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
      ]}>
      <div
        style={{
          position: 'absolute',
          top: 5,
          right: 5,
          borderRadius: '50%',
          width: 20,
          height: 20,
          background: active ? 'red' : 'blue',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      />
      <div ref={containerRef} style={{flex: 1}}>
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
          src={source}
          ref={ref}
          style={a.flex_1}
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
  const {play, pause, playing, muted, togglePlayPause, currentTime, duration} =
    useVideoUtils(videoRef)
  const t = useTheme()
  const {_} = useLingui()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()

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

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
      onClick={evt => {
        evt.stopPropagation()
        if (!focused) {
          if (!active) {
            setActive()
          }
          setFocused(true)
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      {hovered && (
        <>
          <View
            style={[
              a.w_full,
              a.px_xs,
              a.pt_md,
              a.pb_lg,
              a.absolute,
              a.gap_xs,
              a.flex_row,
              {bottom: 0},
              {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
            ]}>
            <Button
              label={_(playing ? msg`Pause` : msg`Play`)}
              onPress={() => togglePlayPause()}
              variant="ghost"
              shape="round"
              size="medium">
              <ButtonIcon icon={playing ? PauseIcon : PlayIcon} />
            </Button>
            <View style={a.flex_1} />
            <Button
              label={_(muted ? msg`Unmute` : msg`Mute`)}
              onPress={() => {
                console.log('clicked mute btn')
              }}
              variant="ghost"
              shape="round"
              size="medium">
              <ButtonIcon icon={muted ? MuteIcon : UnmuteIcon} />
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
              <ButtonIcon icon={FullscreenIcon} />
            </Button>
          </View>
        </>
      )}
      {(hovered || !focused) && (
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

function useVideoUtils(ref: React.RefObject<HTMLVideoElement>) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [canPlay, setCanPlay] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    let current = ref.current

    // Initial values
    setCurrentTime(current.currentTime || 0)
    setDuration(current.duration || 0)
    setCanPlay(current.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
    setMuted(current.muted)
    setPlaying(!current.paused)

    const handleTimeUpdate = () => {
      if (!current) return
      setCurrentTime(current.currentTime || 0)
    }

    const handleDurationChange = () => {
      if (!current) return
      setDuration(current.duration || 0)
    }

    const handlePlay = () => {
      setPlaying(true)
    }

    const handlePause = () => {
      setPlaying(false)
    }

    const handleMute = () => {
      setMuted(true)
    }

    const handleUnmute = () => {
      setMuted(false)
    }

    const handleCanPlay = () => {
      setCanPlay(true)
    }

    ref.current.addEventListener('timeupdate', handleTimeUpdate)
    ref.current.addEventListener('durationchange', handleDurationChange)
    ref.current.addEventListener('play', handlePlay)
    ref.current.addEventListener('pause', handlePause)
    ref.current.addEventListener('mute', handleMute)
    ref.current.addEventListener('unmute', handleUnmute)
    ref.current.addEventListener('ended', handlePause)
    ref.current.addEventListener('error', handlePause)
    ref.current.addEventListener('canplay', handleCanPlay)

    return () => {
      current.removeEventListener('timeupdate', handleTimeUpdate)
      current.removeEventListener('durationchange', handleDurationChange)
      current.removeEventListener('play', handlePlay)
      current.removeEventListener('pause', handlePause)
      current.removeEventListener('mute', handleMute)
      current.removeEventListener('unmute', handleUnmute)
      current.removeEventListener('ended', handlePause)
      current.removeEventListener('error', handlePause)
      current.removeEventListener('canplay', handleCanPlay)
    }
  }, [ref, playing])

  // to explain why I'm doing this in an effect - if you call play()
  // before it's loaded, at least on firefox, it'll throw when you then
  // later go to pause/unload the video. Therefore we should keep
  // play state outside of the video, and then only call it when
  // playing === true and canPlay === true
  useEffect(() => {
    if (!ref.current) return

    if (playing) {
      if (canPlay) {
        ref.current.play()
      }
    } else {
      ref.current.pause()
    }
  }, [playing, ref, canPlay])

  const play = () => {
    setPlaying(true)
  }

  const pause = () => {
    setPlaying(false)
  }

  const togglePlayPause = () => {
    setPlaying(p => !p)
  }

  return {play, pause, togglePlayPause, duration, currentTime, playing, muted}
}

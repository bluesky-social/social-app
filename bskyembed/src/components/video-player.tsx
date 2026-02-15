import {AppBskyEmbedVideo} from '@atproto/api'
import Hls from 'hls.js'
import {h} from 'preact'
import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks'

// --- Icons (inline SVGs) ---

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function MuteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
    </svg>
  )
}

function UnmuteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
  )
}

// --- Bandwidth estimate (module-level) ---

let latestBandwidthEstimate: number | undefined

// --- Volume state (module-level, persists across plays) ---

let storedVolume = 1

// --- Utilities ---

function formatTime(time: number) {
  if (isNaN(time)) return '--'
  time = Math.round(time)
  const minutes = Math.floor(time / 60)
  const seconds = String(time % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(num, max))
}

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

const isFirefox =
  typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent)

// --- useVideoElement hook ---

function useVideoElement(ref: {current: HTMLVideoElement | null}) {
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
    ref.current.volume = storedVolume
  }, [ref])

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current

    let bufferingTimeout: ReturnType<typeof setTimeout> | undefined

    function round(num: number) {
      return Math.round(num * 100) / 100
    }

    setCurrentTime(round(el.currentTime) || 0)
    setDuration(round(el.duration) || 0)
    setMuted(el.muted)
    setPlaying(!el.paused)

    const handleTimeUpdate = () => {
      if (!ref.current) return
      setCurrentTime(round(ref.current.currentTime) || 0)
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      setBuffering(false)
    }
    const handleDurationChange = () => {
      if (!ref.current) return
      setDuration(round(ref.current.duration) || 0)
    }
    const handlePlay = () => setPlaying(true)
    const handlePause = () => setPlaying(false)
    const handleVolumeChange = () => {
      if (!ref.current) return
      setMuted(ref.current.muted)
    }
    const handleError = () => setError(true)
    const handleCanPlay = async () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      setBuffering(false)
      setCanPlay(true)
      if (!ref.current) return
      if (playWhenReadyRef.current) {
        try {
          await ref.current.play()
        } catch {
          // ignore autoplay errors
        }
        playWhenReadyRef.current = false
      }
    }
    const handleCanPlayThrough = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      setBuffering(false)
    }
    const handleWaiting = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      bufferingTimeout = setTimeout(() => setBuffering(true), 500)
    }
    const handlePlaying = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      setBuffering(false)
      setError(false)
    }
    const handleStalled = () => {
      if (bufferingTimeout) clearTimeout(bufferingTimeout)
      bufferingTimeout = setTimeout(() => setBuffering(true), 500)
    }
    const handleEnded = () => {
      setPlaying(false)
      setBuffering(false)
      setError(false)
    }

    const ac = new AbortController()
    const opts = {signal: ac.signal}
    el.addEventListener('timeupdate', handleTimeUpdate, opts)
    el.addEventListener('durationchange', handleDurationChange, opts)
    el.addEventListener('play', handlePlay, opts)
    el.addEventListener('pause', handlePause, opts)
    el.addEventListener('volumechange', handleVolumeChange, opts)
    el.addEventListener('error', handleError, opts)
    el.addEventListener('canplay', handleCanPlay, opts)
    el.addEventListener('canplaythrough', handleCanPlayThrough, opts)
    el.addEventListener('waiting', handleWaiting, opts)
    el.addEventListener('playing', handlePlaying, opts)
    el.addEventListener('stalled', handleStalled, opts)
    el.addEventListener('ended', handleEnded, opts)

    return () => {
      ac.abort()
      clearTimeout(bufferingTimeout)
    }
  }, [ref])

  const play = useCallback(() => {
    if (!ref.current) return
    if (ref.current.ended) ref.current.currentTime = 0
    if (ref.current.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      playWhenReadyRef.current = true
    } else {
      const promise = ref.current.play()
      if (promise !== undefined) {
        promise.catch(() => {})
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

  const changeMuted = useCallback(
    (newMuted: boolean | ((prev: boolean) => boolean)) => {
      if (!ref.current) return
      const value =
        typeof newMuted === 'function' ? newMuted(ref.current.muted) : newMuted
      ref.current.muted = value
    },
    [ref],
  )

  return {
    play,
    pause,
    togglePlayPause,
    duration,
    currentTime,
    playing,
    muted,
    changeMuted,
    buffering,
    error,
    canPlay,
  }
}

// --- Scrubber ---

function Scrubber({
  duration,
  currentTime,
  onSeek,
  onSeekEnd,
  onSeekStart,
  seekLeft,
  seekRight,
  togglePlayPause,
}: {
  duration: number
  currentTime: number
  onSeek: (time: number) => void
  onSeekEnd: () => void
  onSeekStart: () => void
  seekLeft: () => void
  seekRight: () => void
  togglePlayPause: () => void
}) {
  const [scrubberActive, setScrubberActive] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [seekPosition, setSeekPosition] = useState(0)
  const isSeekingRef = useRef(false)
  const barRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)

  const seek = useCallback(
    (evt: PointerEvent) => {
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
    (evt: PointerEvent) => {
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
    (evt: PointerEvent) => {
      if (isSeekingRef.current) {
        evt.preventDefault()
        seek(evt)
      }
    },
    [seek],
  )

  const onPointerUp = useCallback(
    (evt: PointerEvent) => {
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
    if (isFirefox && scrubberActive) {
      document.body.classList.add('force-no-clicks')
      return () => {
        document.body.classList.remove('force-no-clicks')
      }
    }
  }, [scrubberActive])

  useEffect(() => {
    if (!circleRef.current) return
    if (!focused) return
    const el = circleRef.current
    const handler = (evt: KeyboardEvent) => {
      if (evt.key === ' ') {
        evt.preventDefault()
        togglePlayPause()
      } else if (evt.key === 'ArrowLeft') {
        evt.preventDefault()
        seekLeft()
      } else if (evt.key === 'ArrowRight') {
        evt.preventDefault()
        seekRight()
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [focused, seekLeft, seekRight, togglePlayPause])

  const progress = scrubberActive ? seekPosition : currentTime
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0

  if (duration < 3) return null

  return (
    <div
      style={{
        height: isTouchDevice ? 32 : 18,
        width: '100%',
        flexShrink: 0,
        padding: '0 4px',
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}>
      <div
        ref={barRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          cursor: scrubberActive ? 'grabbing' : 'grab',
          padding: '4px 0',
          height: '100%',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}>
        <div
          style={{
            width: '100%',
            borderRadius: 9999,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            height: hovered || scrubberActive ? 6 : 3,
            transition: 'height 0.1s ease',
          }}>
          {duration > 0 && (
            <div
              style={{
                height: '100%',
                backgroundColor: 'white',
                width: `${progressPercent}%`,
              }}
            />
          )}
        </div>
        <div
          ref={circleRef}
          aria-label="Seek slider"
          role="slider"
          aria-valuemax={duration}
          aria-valuemin={0}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          tabIndex={0}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            position: 'absolute',
            height: 16,
            width: 16,
            left: `calc(${progressPercent}% - 8px)`,
            borderRadius: 8,
            pointerEvents: 'none',
          }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 9999,
              backgroundColor: 'white',
              transform: `scale(${
                hovered || scrubberActive || focused
                  ? scrubberActive
                    ? 1
                    : 0.6
                  : 0
              })`,
              transition: 'transform 0.1s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// --- Volume Control ---

function VolumeControl({
  muted,
  changeMuted,
}: {
  muted: boolean
  changeMuted: (muted: boolean | ((prev: boolean) => boolean)) => void
}) {
  const [hovered, setHovered] = useState(false)

  const sliderVolume = muted
    ? 0
    : Math.round(Math.pow(storedVolume, 1 / 4) * 100)

  const onVolumeChange = useCallback(
    (evt: Event) => {
      const target = evt.target as HTMLInputElement
      const vol = Math.pow(Number(target.value) / 100, 4)
      storedVolume = vol
      changeMuted(vol === 0)
    },
    [changeMuted],
  )

  const onPressMute = useCallback(() => {
    if (storedVolume === 0) {
      storedVolume = 1
      changeMuted(false)
    } else {
      changeMuted(prev => !prev)
    }
  }, [changeMuted])

  return (
    <div
      style={{position: 'relative'}}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}>
      {hovered && !isTouchDevice && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: 100,
            bottom: '100%',
          }}>
          <div
            style={{
              flex: 1,
              height: '100%',
              marginBottom: 4,
              padding: '6px 2px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderVolume}
              aria-label="Volume"
              style={{height: '100%'}}
              onChange={onVolumeChange}
              orient="vertical"
            />
          </div>
        </div>
      )}
      <ControlButton
        label={muted || storedVolume === 0 ? 'Unmute' : 'Mute'}
        icon={muted || storedVolume === 0 ? <MuteIcon /> : <UnmuteIcon />}
        onPress={onPressMute}
      />
    </div>
  )
}

// --- Control Button ---

function ControlButton({
  label,
  icon,
  onPress,
}: {
  label: string
  icon: preact.ComponentChildren
  onPress: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        padding: 6,
        borderRadius: 9999,
        background: hovered ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
        transition: 'background-color 0.1s',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {icon}
    </button>
  )
}

// --- Controls ---

function Controls({
  videoRef,
  hlsRef,
  playing,
  muted,
  changeMuted,
  currentTime,
  duration,
  buffering,
  error,
  play,
  pause,
  togglePlayPause,
  hlsLoading,
  isGif,
  containerRef,
}: {
  videoRef: {current: HTMLVideoElement | null}
  hlsRef: {current: Hls | null}
  playing: boolean
  muted: boolean
  changeMuted: (muted: boolean | ((prev: boolean) => boolean)) => void
  currentTime: number
  duration: number
  buffering: boolean
  error: boolean
  play: () => void
  pause: () => void
  togglePlayPause: () => void
  hlsLoading: boolean
  isGif: boolean
  containerRef: {current: HTMLDivElement | null}
}) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const cursorTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showSpinner = hlsLoading || buffering

  // Fullscreen handling
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [containerRef])

  // Buffer management
  useEffect(() => {
    if (!hlsRef.current) return
    if (focused) {
      hlsRef.current.config.maxMaxBufferLength = 30
    } else {
      hlsRef.current.config.maxMaxBufferLength = 10
    }
  }, [hlsRef, focused])

  const showControls = (!focused && !playing) || hovered

  const onPointerMoveEmptySpace = useCallback(() => {
    setShowCursor(true)
    if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current)
    cursorTimeoutRef.current = setTimeout(() => {
      setShowCursor(false)
      setHovered(false)
    }, 2000)
  }, [])

  const onPointerLeaveEmptySpace = useCallback(() => {
    setShowCursor(false)
    if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current)
  }, [])

  const onPressEmptySpace = useCallback(() => {
    if (!focused) {
      setFocused(true)
      play()
    } else {
      togglePlayPause()
    }
  }, [focused, play, togglePlayPause])

  const onHoverWithTimeout = useCallback(() => {
    setHovered(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const onEndHoverWithTimeout = useCallback((evt: PointerEvent) => {
    if (evt.pointerType !== 'mouse') {
      timeoutRef.current = setTimeout(() => setHovered(false), 3000)
    } else {
      setHovered(false)
    }
  }, [])

  const onPointerDown = useCallback(
    (evt: PointerEvent) => {
      if (evt.pointerType !== 'mouse' && !hovered) {
        evt.preventDefault()
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [hovered],
  )

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
    setFocused(true)
    playStateBeforeSeekRef.current = playing
    pause()
  }, [playing, pause])

  const onSeekEnd = useCallback(() => {
    if (playStateBeforeSeekRef.current) play()
  }, [play])

  const seekLeft = useCallback(() => {
    if (!videoRef.current) return
    const dur = videoRef.current.duration || 0
    onSeek(clamp(videoRef.current.currentTime - 5, 0, dur))
  }, [onSeek, videoRef])

  const seekRight = useCallback(() => {
    if (!videoRef.current) return
    const dur = videoRef.current.duration || 0
    onSeek(clamp(videoRef.current.currentTime + 5, 0, dur))
  }, [onSeek, videoRef])

  if (isGif) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={togglePlayPause}>
        {!playing && (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 9999,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <PlayIcon />
          </div>
        )}
        {showSpinner && <div className="video-spinner" />}
        <div
          style={{
            position: 'absolute',
            left: 6,
            bottom: 6,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 6,
            padding: '3px 4px',
            color: 'white',
            fontSize: 11,
            fontWeight: 'bold',
          }}>
          GIF
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={evt => evt.stopPropagation()}
      onPointerEnter={onHoverWithTimeout}
      onPointerMove={onHoverWithTimeout}
      onPointerLeave={onEndHoverWithTimeout}
      onPointerDown={onPointerDown}>
      {/* Empty space - click to play/pause */}
      <div
        style={{
          flex: 1,
          cursor: showCursor || !playing ? 'pointer' : 'none',
        }}
        role="button"
        aria-label={
          !focused ? 'Unmute video' : playing ? 'Pause video' : 'Play video'
        }
        onPointerEnter={onPointerMoveEmptySpace}
        onPointerMove={onPointerMoveEmptySpace}
        onPointerLeave={onPointerLeaveEmptySpace}
        onClick={onPressEmptySpace}
      />
      {/* Time indicator when controls are hidden */}
      {!showControls && !focused && duration > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 6,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 6,
            padding: '3px 6px',
            color: 'white',
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
          }}>
          {formatTime(Math.floor(duration - currentTime))}
        </div>
      )}
      {/* Controls bar */}
      <div
        style={{
          flexShrink: 0,
          width: '100%',
          padding: '0 4px',
          background:
            'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out',
        }}>
        <Scrubber
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
          onSeekStart={onSeekStart}
          onSeekEnd={onSeekEnd}
          seekLeft={seekLeft}
          seekRight={seekRight}
          togglePlayPause={togglePlayPause}
        />
        <div
          style={{
            flex: 1,
            padding: '0 4px 8px',
            gap: 8,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <ControlButton
            label={playing ? 'Pause' : 'Play'}
            icon={playing ? <PauseIcon /> : <PlayIcon />}
            onPress={() => {
              setFocused(true)
              togglePlayPause()
            }}
          />
          <div style={{flex: 1}} />
          {Math.round(duration) > 0 && (
            <span
              style={{
                padding: '0 4px',
                color: 'white',
                fontSize: 14,
                fontVariantNumeric: 'tabular-nums',
              }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
          <VolumeControl muted={muted} changeMuted={changeMuted} />
          <ControlButton
            label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            icon={isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            onPress={() => {
              setFocused(true)
              toggleFullscreen()
            }}
          />
        </div>
      </div>
      {/* Spinner / Error overlay */}
      {(showSpinner || error) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
          {showSpinner && <div className="video-spinner" />}
          {error && (
            <span style={{color: 'white', fontSize: 14}}>
              An error occurred
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main VideoPlayer component (lazy-loaded) ---

export default function VideoPlayer({
  content,
}: {
  content: AppBskyEmbedVideo.View
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [hlsLoading, setHlsLoading] = useState(true)
  const [hlsError, setHlsError] = useState<string | null>(null)

  const isGif = content.presentation === 'gif'

  let aspectRatio = 1
  if (content.aspectRatio) {
    const {width, height} = content.aspectRatio
    aspectRatio = clamp(width / height, 1 / 1, 3 / 1)
  }

  // Setup HLS
  useEffect(() => {
    if (!videoRef.current) return

    if (!Hls.isSupported()) {
      // Try native HLS (Safari)
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = content.playlist
        setHlsLoading(false)
        return
      }
      setHlsError('HLS is not supported in this browser')
      setHlsLoading(false)
      return
    }

    const hls = new Hls({
      maxMaxBufferLength: 10,
      startLevel:
        latestBandwidthEstimate === undefined
          ? -1
          : Hls.DefaultConfig.startLevel,
    })
    hlsRef.current = hls

    if (latestBandwidthEstimate !== undefined) {
      hls.bandwidthEstimate = latestBandwidthEstimate
    }

    hls.attachMedia(videoRef.current)
    hls.loadSource(content.playlist)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setHlsLoading(false)
    })

    hls.on(Hls.Events.FRAG_LOADED, () => {
      if (!isNaN(hls.bandwidthEstimate)) {
        latestBandwidthEstimate = hls.bandwidthEstimate
      }
    })

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        if (
          data.details === 'manifestLoadError' &&
          data.response?.code === 404
        ) {
          setHlsError('Video not found')
        } else {
          setHlsError('An error occurred loading the video')
        }
      }
    })

    return () => {
      hlsRef.current = null
      hls.detachMedia()
      hls.destroy()
    }
  }, [content.playlist])

  const videoEl = useVideoElement(videoRef)

  // Auto-play for GIFs
  useEffect(() => {
    if (isGif && !hlsLoading && videoEl.canPlay) {
      videoEl.play()
    }
  }, [isGif, hlsLoading, videoEl.canPlay, videoEl.play])

  // Auto-play for videos (user clicked to load the player)
  useEffect(() => {
    if (!isGif && !hlsLoading && videoEl.canPlay) {
      videoEl.play()
      videoEl.changeMuted(false)
    }
  }, [isGif, hlsLoading, videoEl.canPlay, videoEl.play, videoEl.changeMuted])

  const figId = useMemo(
    () => `video-fig-${Math.random().toString(36).slice(2)}`,
    [],
  )

  if (hlsError) {
    return (
      <div
        className="w-full overflow-hidden rounded-xl relative flex items-center justify-center bg-black"
        style={{aspectRatio: `${aspectRatio} / 1`}}>
        <span style={{color: 'white', fontSize: 14}}>{hlsError}</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl relative bg-black"
      style={{aspectRatio: `${aspectRatio} / 1`}}>
      <figure style={{margin: 0, position: 'absolute', inset: 0}}>
        <video
          ref={videoRef}
          poster={content.thumbnail}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
          playsInline
          preload="none"
          muted={isGif || !videoEl.canPlay}
          loop={isGif}
          aria-labelledby={content.alt ? figId : undefined}
        />
        {content.alt && (
          <figcaption
            id={figId}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: 0,
            }}>
            {content.alt}
          </figcaption>
        )}
      </figure>
      <Controls
        videoRef={videoRef}
        hlsRef={hlsRef}
        playing={videoEl.playing}
        muted={videoEl.muted}
        changeMuted={videoEl.changeMuted}
        currentTime={videoEl.currentTime}
        duration={videoEl.duration}
        buffering={videoEl.buffering}
        error={videoEl.error}
        play={videoEl.play}
        pause={videoEl.pause}
        togglePlayPause={videoEl.togglePlayPause}
        hlsLoading={hlsLoading}
        isGif={isGif}
        containerRef={containerRef}
      />
    </div>
  )
}

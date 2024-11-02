import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Pressable, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type Hls from 'hls.js'

import {isTouchDevice} from '#/lib/browser'
import {clamp} from '#/lib/numbers'
import {isIPhoneWeb} from '#/platform/detection'
import {
  useAutoplayDisabled,
  useSetSubtitlesEnabled,
  useSubtitlesEnabled,
} from '#/state/preferences'
import {atoms as a, useTheme, web} from '#/alf'
import {useIsWithinMessage} from '#/components/dms/MessageContext'
import {useFullscreen} from '#/components/hooks/useFullscreen'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {
  ArrowsDiagonalIn_Stroke2_Corner0_Rounded as ArrowsInIcon,
  ArrowsDiagonalOut_Stroke2_Corner0_Rounded as ArrowsOutIcon,
} from '#/components/icons/ArrowsDiagonal'
import {
  CC_Filled_Corner0_Rounded as CCActiveIcon,
  CC_Stroke2_Corner0_Rounded as CCInactiveIcon,
} from '#/components/icons/CC'
import {Pause_Filled_Corner0_Rounded as PauseIcon} from '#/components/icons/Pause'
import {Play_Filled_Corner0_Rounded as PlayIcon} from '#/components/icons/Play'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {TimeIndicator} from '../TimeIndicator'
import {ControlButton} from './ControlButton'
import {Scrubber} from './Scrubber'
import {formatTime, useVideoElement} from './utils'
import {VolumeControl} from './VolumeControl'

export function Controls({
  videoRef,
  hlsRef,
  active,
  setActive,
  focused,
  setFocused,
  onScreen,
  fullscreenRef,
  hlsLoading,
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
  hlsLoading: boolean
  hasSubtitleTrack: boolean
}) {
  const {
    play,
    pause,
    playing,
    muted,
    changeMuted,
    togglePlayPause,
    currentTime,
    duration,
    buffering,
    error,
    canPlay,
  } = useVideoElement(videoRef)
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
  const showSpinner = hlsLoading || buffering
  const {
    state: volumeHovered,
    onIn: onVolumeHover,
    onOut: onVolumeEndHover,
  } = useInteractionState()

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

  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.style.scrollbarGutter = 'unset'
      return () => {
        document.documentElement.style.removeProperty('scrollbar-gutter')
      }
    }
  }, [isFullscreen])

  // pause + unfocus when another video is active
  useEffect(() => {
    if (!active) {
      pause()
      setFocused(false)
    }
  }, [active, pause, setFocused])

  // autoplay/pause based on visibility
  const isWithinMessage = useIsWithinMessage()
  const autoplayDisabled = useAutoplayDisabled() || isWithinMessage
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
      // allow 30s of buffering
      hlsRef.current.config.maxMaxBufferLength = 30
    } else {
      // back to what we initially set
      hlsRef.current.config.maxMaxBufferLength = 10
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

  // these are used to trigger the hover state. on mobile, the hover state
  // should stick around for a bit after they tap, and if the controls aren't
  // present this initial tab should *only* show the controls and not activate anything

  const onPointerDown = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      if (evt.pointerType !== 'mouse' && !hovered) {
        evt.preventDefault()
      }
      clearTimeout(timeoutRef.current)
    },
    [hovered],
  )

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const onHoverWithTimeout = useCallback(() => {
    onHover()
    clearTimeout(timeoutRef.current)
  }, [onHover])

  const onEndHoverWithTimeout = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      // if touch, end after 3s
      // if mouse, end immediately
      if (evt.pointerType !== 'mouse') {
        setTimeout(onEndHover, 3000)
      } else {
        onEndHover()
      }
    },
    [onEndHover],
  )

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
      onPointerEnter={onHoverWithTimeout}
      onPointerMove={onHoverWithTimeout}
      onPointerLeave={onEndHoverWithTimeout}
      onPointerDown={onPointerDown}
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
        {(!volumeHovered || isTouchDevice) && (
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
        )}
        <View
          style={[
            a.flex_1,
            a.px_xs,
            a.pb_sm,
            a.gap_sm,
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
          <Text
            style={[
              a.px_xs,
              {color: t.palette.white, fontVariant: ['tabular-nums']},
            ]}>
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
          <VolumeControl
            muted={muted}
            changeMuted={changeMuted}
            hovered={volumeHovered}
            onHover={onVolumeHover}
            onEndHover={onVolumeEndHover}
            drawFocus={drawFocus}
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
      {(showSpinner || error) && (
        <View
          pointerEvents="none"
          style={[a.absolute, a.inset_0, a.justify_center, a.align_center]}>
          {showSpinner && <Loader fill={t.palette.white} size="lg" />}
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

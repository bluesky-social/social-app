import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isFirefox, isTouchDevice} from '#/lib/browser'
import {clamp} from '#/lib/numbers'
import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {formatTime} from './utils'

export function Scrubber({
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
      style={[
        {height: isTouchDevice ? 32 : 18, width: '100%'},
        a.flex_shrink_0,
        a.px_xs,
      ]}
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
          padding: '4px 0',
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
            web({transition: 'height 0.1s ease'}),
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
          aria-label={_(
            msg`Seek slider. Use the arrow keys to seek forwards and backwards, and space to play/pause`,
          )}
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

import React, {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import Hls, {CuesInterface} from 'hls.js'

import {atoms as a} from '#/alf'
import {Controls} from './VideoWebControls'

export function VideoEmbedInner({
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
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLVideoElement>(null)
  const [focused, setFocused] = useState(false)
  const [hasSubtitleTrack, setHasSubtitleTrack] = useState(false)

  const hlsRef = useRef<Hls | undefined>(undefined)

  useEffect(() => {
    if (!ref.current) return
    if (!Hls.isSupported()) throw new HLSUnsupportedError()

    const hls = new Hls({capLevelToPlayerSize: true, cueHandler})
    hlsRef.current = hls

    hls.attachMedia(ref.current)
    hls.loadSource(source)

    // initial value, later on it's managed by Controls
    hls.autoLevelCapping = 0

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
      if (data.subtitleTracks.length > 0) {
        setHasSubtitleTrack(true)
      }
    })

    return () => {
      hlsRef.current = undefined
      hls.detachMedia()
      hls.destroy()
    }
  }, [source])

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
        <video
          ref={ref}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
          playsInline
          preload="none"
          loop
          muted={!focused}
        />
        <Controls
          videoRef={ref}
          hlsRef={hlsRef}
          active={active}
          setActive={setActive}
          focused={focused}
          setFocused={setFocused}
          onScreen={onScreen}
          fullscreenRef={containerRef}
          hasSubtitleTrack={hasSubtitleTrack}
        />
      </div>
    </View>
  )
}

export class HLSUnsupportedError extends Error {
  constructor() {
    super('HLS is not supported')
  }
}

// copy-pasted from https://github.com/dailymotion/hls.js/blob/master/src/utils/cues.js
//
// modified to change the line calculation for Firefox - I've annotated the change
const cueHandler: CuesInterface = {
  newCue: (track, startTime, endTime, captionScreen) => {
    let row
    let cue
    let indenting
    let indent
    let text
    let VTTCue = window.VTTCue || window.TextTrackCue

    const cues = []

    for (let r = 0; r < captionScreen.rows.length; r++) {
      row = captionScreen.rows[r]
      indenting = true
      indent = 0
      text = ''

      if (!row.isEmpty()) {
        for (let c = 0; c < row.chars.length; c++) {
          if (row.chars[c].uchar.match(/\s/) && indenting) {
            indent++
          } else {
            text += row.chars[c].uchar
            indenting = false
          }
        }
        // To be used for cleaning-up orphaned roll-up captions
        row.cueStartTime = startTime

        // Give a slight bump to the endTime if it's equal to startTime to avoid a SyntaxError in IE
        if (startTime === endTime) {
          endTime += 0.0001
        }

        cue = new VTTCue(startTime, endTime, fixLineBreaks(text.trim()))

        if (indent >= 16) {
          indent--
        } else {
          indent++
        }

        // VTTCue.line get's flakey when using controls, so let's now include line 13&14
        // also, drop line 1 since it's to close to the top
        if (navigator.userAgent.match(/Firefox\//)) {
          cue.line = -2
        } else {
          cue.line = r > 7 ? r - 2 : r + 1
        }

        cue.align = 'left'
        // Clamp the position between 0 and 100 - if out of these bounds, Firefox throws an exception and captions break
        cue.position = Math.max(
          0,
          Math.min(
            100,
            100 * (indent / 32) +
              (navigator.userAgent.match(/Firefox\//) ? 50 : 0),
          ),
        )
        // modified - they had a type error
        cues.push(cue)
        if (track) {
          track.addCue(cue)
        }
      }
    }

    return cues
  },
}

function fixLineBreaks(input: string) {
  return input.replace(/<br(?: \/)?>/gi, '\n')
}

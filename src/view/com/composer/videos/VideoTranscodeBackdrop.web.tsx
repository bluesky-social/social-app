import React from 'react'

export function VideoTranscodeBackdrop({uri}: {uri: string}) {
  return (
    <video src={uri} style={{flex: 1, filter: 'blur(10px)'}} muted autoPlay />
  )
}

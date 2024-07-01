import React, {useContext, useEffect} from 'react'
import type {VideoPlayer} from 'expo-video'
import {useVideoPlayer as useExpoVideoPlayer} from 'expo-video'

const VideoPlayerContext = React.createContext<VideoPlayer | null>(null)

export function VideoPlayerProvider({
  viewId,
  source,
  children,
}: {
  viewId: string | null
  source: string
  children: React.ReactNode
}) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const player = useExpoVideoPlayer(source, player => {
    player.loop = true
    player.play()
  })

  // make sure we're playing every time the viewId changes
  // this means the video is different
  useEffect(() => {
    player.play()
  }, [viewId, player])

  return (
    <VideoPlayerContext.Provider value={player}>
      {children}
    </VideoPlayerContext.Provider>
  )
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext)
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider')
  }
  return context
}

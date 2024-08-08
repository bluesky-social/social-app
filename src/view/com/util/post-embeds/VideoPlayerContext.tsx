import React, {useContext} from 'react'
import type {VideoPlayer} from 'expo-video'
import {useVideoPlayer as useExpoVideoPlayer} from 'expo-video'

const VideoPlayerContext = React.createContext<VideoPlayer | null>(null)

export function VideoPlayerProvider({
  source,
  children,
}: {
  source: string
  children: React.ReactNode
}) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const player = useExpoVideoPlayer(source, player => {
    player.loop = true
    player.play()
  })

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

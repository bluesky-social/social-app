import React from 'react'

const VideoPlayerContext = React.createContext<null>(null)

export function VideoPlayerProvider({children}: {children: React.ReactNode}) {
  return (
    <VideoPlayerContext.Provider value={null}>
      {children}
    </VideoPlayerContext.Provider>
  )
}

export function useVideoPlayer() {
  throw new Error('useVideoPlayer must not be used on web')
}

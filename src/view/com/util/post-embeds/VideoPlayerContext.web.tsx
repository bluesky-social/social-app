import React from 'react'

export function VideoPlayerProvider({children}: {children: React.ReactNode}) {
  return children
}

export function useVideoPlayer() {
  throw new Error('useVideoPlayer must not be used on web')
}

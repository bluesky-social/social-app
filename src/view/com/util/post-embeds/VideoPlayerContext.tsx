import React, {useContext} from 'react'
import type {VideoPlayer} from 'expo-video'
import {useVideoPlayer as useExpoVideoPlayer} from 'expo-video'

import {logger} from '#/logger'
import {
  AudioCategory,
  PlatformInfo,
} from '../../../../../modules/expo-bluesky-swiss-army'

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
    try {
      PlatformInfo.setAudioCategory(AudioCategory.Ambient)
      PlatformInfo.setAudioActive(false)

      player.loop = true
      player.muted = true
      player.play()
    } catch (err) {
      logger.error('Failed to init video player', {safeMessage: err})
    }
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

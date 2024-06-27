import React, {useCallback, useId, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {VideoEmbedInner} from './VideoEmbedInner'
import {VideoPlayerProvider} from './VideoPlayerContext'

const ActiveVideoContext = React.createContext<{
  activeVideo: string | null
  setActiveVideo: (video: string, src: string) => void
} | null>(null)

export function ActiveVideoProvider({children}: {children: React.ReactNode}) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const value = useMemo(
    () => ({
      activeVideo,
      setActiveVideo: (video: string, src: string) => {
        setActiveVideo(video)
        setSource(src)
      },
    }),
    [activeVideo, setActiveVideo],
  )

  return (
    <ActiveVideoContext.Provider value={value}>
      {source ? (
        <VideoPlayerProvider source={source}>{children}</VideoPlayerProvider>
      ) : (
        children
      )}
    </ActiveVideoContext.Provider>
  )
}

function useActiveVideo() {
  const context = React.useContext(ActiveVideoContext)
  if (!context) {
    throw new Error('useActiveVideo must be used within a ActiveVideoProvider')
  }
  const id = useId()

  return {
    active: context.activeVideo === id,
    setActive: useCallback(
      (source: string) => context.setActiveVideo(id, source),
      [context, id],
    ),
  }
}

export function VideoEmbed({source}: {source: string}) {
  const t = useTheme()
  const {active, setActive} = useActiveVideo()
  const {_} = useLingui()

  const onPress = useCallback(() => setActive(source), [setActive, source])

  return (
    <View
      style={[
        a.w_full,
        a.rounded_sm,
        {aspectRatio: 16 / 9},
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
        a.my_xs,
      ]}>
      {active ? (
        <VideoEmbedInner source={source} />
      ) : (
        <Button
          style={[a.flex_1, t.atoms.bg_contrast_25]}
          onPress={onPress}
          label={_(msg`Play video`)}
          variant="ghost"
          color="secondary"
          size="large">
          <ButtonIcon icon={PlayIcon} />
        </Button>
      )}
    </View>
  )
}

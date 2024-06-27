import React, {useCallback, useId, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {VideoEmbedInner} from './VideoEmbedInner'

const ActiveVideoContext = React.createContext<{
  activeVideo: string | null
  setActiveVideo: (video: string) => void
} | null>(null)

export function ActiveVideoProvider({children}: {children: React.ReactNode}) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  const value = useMemo(
    () => ({activeVideo, setActiveVideo}),
    [activeVideo, setActiveVideo],
  )

  return (
    <ActiveVideoContext.Provider value={value}>
      {children}
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
    setActive: useCallback(() => context.setActiveVideo(id), [context, id]),
  }
}

export function VideoEmbed({source}: {source: string}) {
  const t = useTheme()
  const {active, setActive} = useActiveVideo()
  const {_} = useLingui()

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
          onPress={setActive}
          label={_(msg`Play video`)}
          variant="ghost"
          color="secondary">
          <ButtonText>
            <Trans>Play video</Trans>
          </ButtonText>
        </Button>
      )}
    </View>
  )
}

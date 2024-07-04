import React, {useCallback, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {useActiveVideoView} from './ActiveVideoContext'
import {VideoEmbedInner} from './VideoEmbedInner'

export function VideoEmbed({source}: {source: string}) {
  const t = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const {active, setActive} = useActiveVideoView({
    source,
    measure: () => {
      if (ref.current) {
        return ref.current.getBoundingClientRect()
      }
    },
  })
  const [hasBeenActive, setHasBeenActive] = useState(false)
  const {_} = useLingui()

  const onPress = useCallback(() => setActive(), [setActive])

  useEffect(() => {
    if (active) {
      setHasBeenActive(true)
    }
  }, [active])

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
      <div ref={ref} style={{display: 'flex', flex: 1}}>
        {hasBeenActive ? (
          <VideoEmbedInner source={source} active={active} />
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
      </div>
    </View>
  )
}

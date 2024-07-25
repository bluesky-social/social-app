import React, {useCallback, useState} from 'react'
import {View, ViewToken} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useNonReactiveCallback} from 'lib/hooks/useNonReactiveCallback'
import {VisibilityEmitter} from 'view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Play_Filled_Corner2_Rounded as PlayIcon} from '#/components/icons/Play'
import {useActiveVideoView} from './ActiveVideoContext'
import {VideoEmbedInner} from './VideoEmbedInner'

export function VideoEmbed({source}: {source: string}) {
  const t = useTheme()
  const {active, setActive} = useActiveVideoView()
  const {_} = useLingui()

  const [isVisibleInList, setIsVisibleInList] = useState(false)
  const [isVisibleOnScreen, setIsVisibleOnScreen] = useState(false)

  useFocusEffect(
    useNonReactiveCallback(() => {
      const onViewableItemsChanged = (viewableItems: ViewToken[]) => {
        console.log('test')
        console.log(viewableItems)
      }

      VisibilityEmitter.addListener(
        'viewableItemsChanged',
        onViewableItemsChanged,
      )
      console.log('hello')
      return () => {
        console.log('bye')
        VisibilityEmitter.removeListener(
          'viewableItemsChanged',
          onViewableItemsChanged,
        )
      }
    }),
  )

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

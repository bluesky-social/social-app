import React, {useCallback} from 'react'
import {View} from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Trash_Stroke2_Corner2_Rounded as TrashIcon} from '#/components/icons/Trash'

export function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode
  onDelete: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()

  const renderActions = useCallback(() => {
    return (
      <Button label={_(msg`Delete chat`)} onPress={onDelete} style={[a.px_lg]}>
        <View
          style={[
            {height: 50, width: 50, backgroundColor: t.palette.negative_400},
            a.rounded_full,
            a.align_center,
            a.justify_center,
          ]}>
          <TrashIcon fill={t.palette.white} size="xl" />
        </View>
      </Button>
    )
  }, [_, t, onDelete])

  return (
    <Swipeable
      renderRightActions={renderActions}
      containerStyle={[{backgroundColor: t.palette.negative_25}]}>
      {children}
    </Swipeable>
  )
}

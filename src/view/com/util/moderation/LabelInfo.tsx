import {ComAtprotoLabelDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {usePalette} from 'lib/hooks/usePalette'
import React from 'react'
import {Pressable, StyleProp, View, ViewStyle} from 'react-native'

import {useModalControls} from '#/state/modals'

import {Text} from '../text/Text'

export function LabelInfo({
  details,
  labels,
  style,
}: {
  details: {did: string} | {uri: string; cid: string}
  labels: ComAtprotoLabelDefs.Label[] | undefined
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openModal} = useModalControls()

  if (!labels) {
    return null
  }
  labels = labels.filter(l => !l.val.startsWith('!'))
  if (!labels.length) {
    return null
  }

  return (
    <View
      style={[
        pal.viewLight,
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 8,
        },
        style,
      ]}>
      <Text type="sm" style={pal.text}>
        <Trans>
          A content warning has been applied to this{' '}
          {'did' in details ? 'account' : 'post'}.
        </Trans>{' '}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Appeal this decision`)}
        accessibilityHint=""
        onPress={() => openModal({name: 'appeal-label', ...details})}>
        <Text type="sm" style={pal.link}>
          <Trans>Appeal this decision.</Trans>
        </Text>
      </Pressable>
    </View>
  )
}

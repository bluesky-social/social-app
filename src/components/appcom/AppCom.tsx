import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '../Typography'
import type {AppComNode} from './types'
import {AppComponent} from './vocabulary'

export function AppComponentRegion({
  tree,
  origin,
}: {
  tree: AppComNode
  origin: string
}) {
  const t = useTheme()
  return (
    <View style={[a.border, t.atoms.border_contrast_medium, a.rounded_sm]}>
      <View
        style={[
          t.atoms.bg_contrast_25,
          a.px_md,
          a.py_sm,
          {
            borderTopLeftRadius: a.rounded_sm.borderRadius,
            borderTopRightRadius: a.rounded_sm.borderRadius,
          },
        ]}>
        <Text
          style={[
            t.atoms.text_contrast_medium,
            a.text_xs,
            {fontFamily: 'monospace'},
          ]}>
          {origin}
        </Text>
      </View>
      <View style={[a.px_md, a.py_lg]}>
        <AppComponent node={tree} />
      </View>
    </View>
  )
}

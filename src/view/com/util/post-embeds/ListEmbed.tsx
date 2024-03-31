import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AppBskyGraphDefs} from '@atproto/api'

import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {ListCard} from 'view/com/lists/ListCard'

export function ListEmbed({
  item,
  style,
}: {
  item: AppBskyGraphDefs.ListView
  style?: StyleProp<ViewStyle>
}) {
  const pal = usePalette('default')

  return (
    <View style={[pal.view, pal.border, s.border1, styles.container]}>
      <ListCard list={item} style={[style, styles.card]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
  },
  card: {
    borderTopWidth: 0,
    borderRadius: 8,
  },
})

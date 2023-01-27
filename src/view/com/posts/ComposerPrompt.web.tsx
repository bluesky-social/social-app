import React from 'react'
import {StyleSheet, TouchableWithoutFeedback, View} from 'react-native'
import {Text} from '../util/text/Text'
import {usePalette} from '../../lib/hooks/usePalette'
import {s} from '../../lib/styles'

export function ComposerPrompt({
  onPressCompose,
}: {
  onPressCompose: (imagesOpen?: boolean) => void
}) {
  const pal = usePalette('default')
  return (
    <TouchableWithoutFeedback onPress={() => onPressCompose(false)}>
      <View style={[pal.view, pal.border, styles.container]}>
        <Text type="xl" style={pal.textLight}>
          What's up?
        </Text>
        <View style={s.flex1} />
        <View style={[styles.btn, pal.btn]}>
          <Text>Post</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
  },
})

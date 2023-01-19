import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from '../util/text/Text'
import {usePalette} from '../../lib/hooks/usePalette'

export function PromptButtons({
  onPressCompose,
}: {
  onPressCompose: (imagesOpen?: boolean) => void
}) {
  const pal = usePalette('default')
  return (
    <View style={[pal.view, pal.border, styles.container]}>
      <TouchableOpacity
        testID="composePromptButton"
        style={[styles.btn, {backgroundColor: pal.colors.backgroundLight}]}
        onPress={() => onPressCompose(false)}>
        <Text type="button" style={pal.textLight}>
          New post
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, {backgroundColor: pal.colors.backgroundLight}]}
        onPress={() => onPressCompose(true)}>
        <Text type="button" style={pal.textLight}>
          Share photo
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
    marginRight: 10,
  },
})

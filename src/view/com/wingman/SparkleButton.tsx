import React from 'react'
import {Pressable, StyleSheet} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {SparkleIcon} from 'lib/icons-w2'
import {pressableOpacity} from 'lib/pressableOpacity'

const SIZE = 44

export const SparkleButton = ({}: {}) => {
  const pal = usePalette('inverted')

  return (
    <Pressable
      style={pressableOpacity([pal.view, pal.borderDark, styles.container])}
      accessibilityRole="button"
      accessibilityLabel="TODO"
      accessibilityHint="TODO">
      <SparkleIcon style={styles.sparkle} size={24} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    height: SIZE,
    width: SIZE,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {color: '#B87CD4'},
})

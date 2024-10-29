import React from 'react'
import {StyleSheet, View} from 'react-native'

import {useTheme} from '#/alf'

export function SubtleWebHover({hover}: {hover: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        t.atoms.bg_contrast_25,
        styles.container,
        {
          opacity: hover ? 0.5 : 0,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    pointerEvents: 'none',
    // @ts-ignore web only
    transition: '0.05s ease-in-out opacity',
  },
})

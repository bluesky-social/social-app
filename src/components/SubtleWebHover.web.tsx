import React from 'react'
import {StyleSheet, View} from 'react-native'

import {isTouchDevice} from '#/lib/browser'
import {useTheme, ViewStyleProp} from '#/alf'

export function SubtleWebHover({
  style,
  hover,
}: ViewStyleProp & {hover: boolean}) {
  const t = useTheme()
  if (isTouchDevice) {
    return null
  }
  let opacity: number
  switch (t.name) {
    case 'dark':
      opacity = 0.4
      break
    case 'dim':
      opacity = 0.45
      break
    case 'light':
      opacity = 0.5
      break
  }
  return (
    <View
      style={[
        t.atoms.bg_contrast_25,
        styles.container,
        {opacity: hover ? opacity : 0},
        style,
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
    transition: '0.15s ease-in-out opacity',
  },
})

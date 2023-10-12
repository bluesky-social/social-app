import React from 'react'
import {View, StyleSheet, Dimensions} from 'react-native'

import {usePalette} from 'lib/hooks/usePalette'

export function Outer(props: React.PropsWithChildren<{}>) {
  const pal = usePalette('default')

  return (
    <>
      <View style={[pal.view, styles.background]} />

      {props.children}
    </>
  )
}

export function Content(props: React.PropsWithChildren<{}>) {
  return <View style={styles.content}>{props.children}</View>
}

export function Handle() {
  const pal = usePalette('default')
  return (
    <View style={[styles.handle, {backgroundColor: pal.border.borderColor}]} />
  )
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: Dimensions.get('window').height * 2,
    zIndex: 1,
  },
  content: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    zIndex: 2,
  },
  handle: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 80,
    height: 6,
    borderRadius: 10,
    zIndex: 2,
  },
})

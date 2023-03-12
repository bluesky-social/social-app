import React from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {DesktopSearch} from './Search'

export const DesktopRightNav = observer(function DesktopRightNav() {
  const pal = usePalette('default')
  return (
    <View style={[styles.rightNav, pal.view]}>
      <DesktopSearch />
    </View>
  )
})

const styles = StyleSheet.create({
  rightNav: {
    position: 'absolute',
    top: 20,
    left: 'calc(50vw + 330px)',
    width: 300,
  },
})

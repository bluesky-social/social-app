import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'

import {useShellLayout} from '#/state/shell/shell-layout'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {Logo} from '#/view/icons/Logo'
import {atoms} from '#/alf'

export function HomeHeaderLayoutMobile({
  children,
}: {
  children: React.ReactNode
  tabBarAnchor: JSX.Element | null | undefined
}) {
  const pal = usePalette('default')
  const {headerHeight} = useShellLayout()
  const {headerMinimalShellTransform} = useMinimalShellMode()

  return (
    <Animated.View
      style={[pal.view, pal.border, styles.tabBar, headerMinimalShellTransform]}
      onLayout={e => {
        headerHeight.value = e.nativeEvent.layout.height
      }}>
      <View style={[pal.view, styles.topBar]}>
        <View style={[atoms.flex_row, atoms.align_end, atoms.gap_md]}>
          <Logo width={30} />
        </View>
      </View>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    // @ts-ignore web-only
    position: isWeb ? 'fixed' : 'absolute',
    zIndex: 1,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'column',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    width: '100%',
  },
  title: {
    fontSize: 21,
  },
})

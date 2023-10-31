import React, {useEffect, useRef} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  Animated,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useScreenGeometry} from 'lib/hooks/waverly/useScreenGeometry'
import {useFunctionRef} from 'lib/hooks/waverly/useFunctionRef'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const ANIM_DURATION = 300

interface Props {
  visible?: boolean
  children?: React.ReactNode
  onHeightChanged?: (height: number) => void
}

export const ToolDrawer = ({visible, children, onHeightChanged}: Props) => {
  const pal = usePalette('primary')
  const safeAreaInsets = useSafeAreaInsets()

  const refs = useRef({
    animVal: useAnimatedValue(0),
    heightVal: useAnimatedValue(0),
    visible: !!visible,
    height: 0,
  }).current
  const translateY = useRef(
    Animated.multiply(refs.animVal, refs.heightVal),
  ).current

  const {ref, onLayout, screenGeometry} = useScreenGeometry()

  const [onDrawerLayout] = useFunctionRef((e: LayoutChangeEvent) => {
    const newHeight = e.nativeEvent.layout.height
    if (newHeight === refs.height) return
    refs.heightVal.setValue(newHeight)
    refs.height = newHeight
    if (refs.visible) _onHeightChanged(newHeight)
  })

  const [_onHeightChanged] = useFunctionRef(onHeightChanged)

  useEffect(() => {
    // If visible, go to -1 so we translate the drawer into view.
    refs.visible = !!visible
    const toValue = visible ? -1 : 0
    Animated.timing(refs.animVal, {
      duration: ANIM_DURATION,
      toValue,
      useNativeDriver: true,
    }).start(() => {
      _onHeightChanged(refs.visible ? refs.height : 0)
    })
  }, [_onHeightChanged, refs, visible])

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      style={styles.container}
      pointerEvents="box-none">
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={
          (screenGeometry?.pageY ?? 0) - safeAreaInsets.bottom
        }
        style={styles.container}
        pointerEvents="box-none">
        <Animated.View
          onLayout={onDrawerLayout}
          style={[
            styles.drawer,
            pal.view,
            pal.border,
            {paddingBottom: safeAreaInsets.bottom},
            {transform: [{translateY}]},
          ]}>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
})

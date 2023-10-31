import React, {useCallback, useEffect, useRef} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import {clamp} from 'lib/numbers'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {styles} from '../../../shell/bottom-bar/BottomBarStyles'
import {alphaBg} from 'lib/styles'
import {LinkIcon, RedoIcon, UndoIcon} from 'lib/icons-w2'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {BlurView} from '../../util/BlurView'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const ANIM_DURATION = 300

interface Props {
  visible: boolean
  blur?: boolean
  onUndo: () => void
  onRedo: () => void
}

export const Toolbar = ({visible, blur, onUndo, onRedo}: Props) => {
  const pal = usePalette('default')
  const safeAreaInsets = useSafeAreaInsets()

  const animVal = useAnimatedValue(0)
  const height = useAnimatedValue(0)
  const slideAway = useRef(Animated.multiply(animVal, height)).current

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => height.setValue(e.nativeEvent.layout.height),
    [height],
  )

  useEffect(() => {
    const toValue = visible ? 0 : 1
    Animated.timing(animVal, {
      duration: ANIM_DURATION,
      toValue,
      useNativeDriver: false,
    }).start()
  }, [animVal, visible])

  if (blur) {
    return (
      <Animated.View
        onLayout={onLayout}
        style={[
          styles.bottomBar,
          localStyles.rightPadding,
          pal.border,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
          {transform: [{translateY: slideAway}]},
        ]}>
        <BlurView style={styles.bottomBar} blurType="light">
          <Btn accessibilityLabel="Undo" accessibilityHint="" onPress={onUndo}>
            <UndoIcon size={24} style={[styles.ctrlIcon, pal.text]} />
          </Btn>
          <Btn accessibilityLabel="Redo" accessibilityHint="" onPress={onRedo}>
            <RedoIcon size={24} style={[styles.ctrlIcon, pal.text]} />
          </Btn>
          <Btn accessibilityLabel="Add link" accessibilityHint="">
            <LinkIcon size={24} style={[styles.ctrlIcon, pal.text]} />
          </Btn>
          <Btn accessibilityLabel="Add image" accessibilityHint="">
            <FontAwesomeIcon
              icon="image"
              size={24}
              style={[styles.ctrlIcon, pal.text]}
            />
          </Btn>
        </BlurView>
      </Animated.View>
    )
  } else {
    return (
      <Animated.View
        onLayout={onLayout}
        style={[
          styles.bottomBar,
          localStyles.rightPadding,
          alphaBg(pal.view, 0.7),
          pal.border,
          {paddingBottom: clamp(safeAreaInsets.bottom, 15, 30)},
          {transform: [{translateY: slideAway}]},
        ]}>
        <Btn accessibilityLabel="Undo" accessibilityHint="" onPress={onUndo}>
          <UndoIcon size={24} style={[styles.ctrlIcon, pal.text]} />
        </Btn>
        <Btn accessibilityLabel="Redo" accessibilityHint="" onPress={onRedo}>
          <RedoIcon size={24} style={[styles.ctrlIcon, pal.text]} />
        </Btn>
        <Btn accessibilityLabel="Add link" accessibilityHint="">
          <LinkIcon size={24} style={[styles.ctrlIcon, pal.text]} />
        </Btn>
        <Btn accessibilityLabel="Add image" accessibilityHint="">
          <FontAwesomeIcon
            icon="image"
            size={24}
            style={[styles.ctrlIcon, pal.text]}
          />
        </Btn>
      </Animated.View>
    )
  }
}

interface BtnProps {
  onPress?: () => void
  accessibilityLabel: string
  accessibilityHint: string
  children?: React.ReactNode
}

function Btn({onPress, accessibilityLabel, children}: BtnProps) {
  return (
    <TouchableOpacity
      style={styles.ctrl}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityLabel}>
      {children}
    </TouchableOpacity>
  )
}

const localStyles = StyleSheet.create({
  // Padding for the fab button
  rightPadding: {
    paddingRight: 90,
  },
})

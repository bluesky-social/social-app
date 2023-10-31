import React, {useCallback, useEffect, useMemo} from 'react'
import {Animated, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const ANIM_DURATION = 200

const WIDTH = 200
const HEIGHT = 28
const PADDING = 2
const GAP = 8

const SWITCH_WIDTH = (WIDTH - 2 * PADDING - GAP) / 2
const SWITCH_HEIGHT = HEIGHT - 2 * PADDING
const DISTANCE = SWITCH_WIDTH + GAP

export type ReaderState =
  | 'loading'
  | 'error'
  | 'reader_available'
  | 'reader_unavailable'

export type ReaderMode = 'reader' | 'html'

interface Props {
  state?: ReaderState
  mode?: ReaderMode
  onChangeMode: (newMode: ReaderMode) => void
}

export const ReaderToggle = ({state, mode, onChangeMode}: Props) => {
  const pal = usePalette('default')

  const animValue = useAnimatedValue(0)

  const translateX = Animated.multiply(animValue, DISTANCE)

  const onPress = useCallback(() => {
    const newMode = mode === 'reader' ? 'html' : 'reader'
    onChangeMode(newMode)
  }, [mode, onChangeMode])

  useEffect(() => {
    const toValue = mode === 'html' ? 0 : 1
    Animated.timing(animValue, {
      toValue,
      duration: ANIM_DURATION,
      useNativeDriver: false,
    }).start()
  }, [animValue, mode])

  const disabled = useMemo(
    () => state === 'loading' || state === 'error' || !mode,
    [state, mode],
  )

  const readerDisabled = useMemo(
    () => disabled || state === 'reader_unavailable',
    [disabled, state],
  )

  return (
    <TouchableOpacity
      activeOpacity={1}
      accessibilityRole="button"
      disabled={readerDisabled}
      style={[styles.container, pal.viewLight]}
      onPress={onPress}>
      {state !== 'loading' && (
        <Animated.View
          style={[
            styles.switch,
            styles.waverlyColor,
            {transform: [{translateX}]},
          ]}
        />
      )}
      <View style={styles.label}>
        <Text type="sm" style={disabled ? pal.textLight : pal.text}>
          Web
        </Text>
      </View>
      <View style={styles.label}>
        <Text type="sm" style={readerDisabled ? pal.textLight : pal.text}>
          Reader View
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    padding: PADDING,
    gap: GAP,
  },
  switch: {
    position: 'absolute',
    left: PADDING,
    top: PADDING,
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: 4,
  },
  label: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waverlyColor: {
    backgroundColor: '#C9B6F2',
  },
})

import React, {useCallback, useEffect, useState} from 'react'
import {colors} from 'lib/styles'
import {Animated, StyleSheet, TouchableOpacity} from 'react-native'
import {KeyboardIcon, SparkleIcon} from 'lib/icons-w2'
import {WordDJMode} from 'state/models/w2/WordDJModel'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const ANIM_DURATION = 200

const WIDTH = 80
const HEIGHT = 40
const CIRCLE_DIAM = 32
const ICON_SIZE = 24

const CIRCLE_PADDING = (HEIGHT - CIRCLE_DIAM) / 2
const ICON_PADDING = (HEIGHT - ICON_SIZE) / 2

const DISTANCE = WIDTH - 2 * CIRCLE_PADDING - CIRCLE_DIAM

interface Props {
  disabled?: boolean
  onSetCurrentMode?: (newMode: WordDJMode) => void
}

export const ModePicker = ({disabled, onSetCurrentMode}: Props) => {
  const backgroundColor = disabled ? colors.white : colors.gray3

  const [mode, setMode] = useState<WordDJMode>('word-dj')

  const animValue = useAnimatedValue(0)

  const circleColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.waverly1, '#5398FF'],
  })

  const onPress = useCallback(() => {
    const newMode = mode === 'word-dj' ? 'manual' : 'word-dj'
    setMode(newMode)
    if (onSetCurrentMode) onSetCurrentMode(newMode)
  }, [mode, onSetCurrentMode])

  useEffect(() => {
    const toValue = mode === 'word-dj' ? 0 : 1
    Animated.timing(animValue, {
      toValue,
      duration: ANIM_DURATION,
      useNativeDriver: false,
    }).start()
  }, [animValue, mode])

  return (
    <TouchableOpacity
      activeOpacity={1}
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.container, {backgroundColor}]}
      onPress={onPress}>
      <Animated.View
        style={[
          styles.circle,
          {backgroundColor: circleColor},
          {transform: [{translateX: Animated.multiply(animValue, DISTANCE)}]},
        ]}
      />
      <SparkleIcon
        size={ICON_SIZE}
        variant="filled"
        style={{color: colors.white}}
      />
      <KeyboardIcon size={ICON_SIZE} style={{color: colors.white}} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ICON_PADDING,
  },
  circle: {
    position: 'absolute',
    left: CIRCLE_PADDING,
    top: CIRCLE_PADDING,
    width: CIRCLE_DIAM,
    height: CIRCLE_DIAM,
    borderRadius: CIRCLE_DIAM / 2,
  },
})

import React, {useEffect, useMemo, useRef} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {StyleSheet, ViewStyle, StyleProp, Animated, View} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {BlockState} from 'state/models/w2/WordDJModel'
import {colors} from 'lib/styles'
import {IsQuote} from '../util/Quote'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const SCALE = 1.03
const ROTATE = '2deg'
const ANIM_DURATION = 50

interface Props {
  text?: string
  state?: BlockState
  style?: StyleProp<ViewStyle>
}

export const Block = ({text, state, style}: Props) => {
  const defaultPal = usePalette('default')
  const selectedPal = usePalette('primary')

  const val = useAnimatedValue(0)
  const scale = useRef(
    val.interpolate({inputRange: [0, 1], outputRange: [1, SCALE]}),
  ).current
  const rotate = useRef(
    val.interpolate({inputRange: [0, 1], outputRange: ['0deg', ROTATE]}),
  ).current

  useEffect(() => {
    const toValue = state === 'moving' ? 1 : 0
    Animated.timing(val, {
      duration: ANIM_DURATION,
      toValue,
      useNativeDriver: false,
    }).start()
  }, [val, state])

  const pal = state === 'selected' ? selectedPal : defaultPal

  const fullStyle = useMemo(() => {
    const result: StyleProp<ViewStyle> = [styles.container]
    if (state === 'moving' || state === 'selected')
      result.push(selectedPal.borderDark, styles.border)
    result.push(state === 'selected' ? pal.view : pal.viewLight)
    result.push(style)
    return result
  }, [pal, selectedPal, style, state])

  const quoteBlock = IsQuote(text)
  const textToRender = quoteBlock.asQuote ? quoteBlock.asQuote : text
  return (
    <Animated.View
      style={[
        fullStyle,
        {transform: [{scale}, {rotate}]},
        quoteBlock.bIsQuote && styles.quoteBlock,
      ]}>
      {!quoteBlock.bIsQuote && (
        <Text type={'lg'} style={pal.text}>
          {textToRender}
        </Text>
      )}
      {quoteBlock.bIsQuote && (
        <View style={styles.innerQuoteBlock}>
          <View style={[styles.verticalLine]} />
          <Text type={'sm-medium'} style={(pal.text, styles.quoteText)}>
            {textToRender}
          </Text>
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    margin: 2,
    padding: 8,
  },
  border: {
    borderWidth: 2,
    padding: 6,
  },
  quoteBlock: {
    backgroundColor: colors.gray2,
    borderRadius: 8,
  },
  verticalLine: {
    width: 2,
    backgroundColor: colors.waverly1,
  },
  innerQuoteBlock: {
    flexDirection: 'row',
    margin: 2,
    gap: 8,
  },
  quoteText: {
    paddingRight: 4,
    paddingVertical: 2,
  },
})

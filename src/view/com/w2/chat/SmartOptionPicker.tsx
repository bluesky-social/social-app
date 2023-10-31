import React, {useCallback, useEffect, useState} from 'react'
import {
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
  ScrollView,
  Animated,
  Easing,
} from 'react-native'
import {s} from 'lib/styles'
import {SmartSmallButton} from './SmartSmallButton'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'

const TICKER_SPEED = 70.0 // In horizontal pixels per second

interface Props<T> {
  options: readonly T[]
  oldScrollPos: number
  setSavedScrollPos: (sp: number) => void
  labelFunction: (option: T) => string
  onSelected: (option: T) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function SmartOptionPicker<T>({
  options,
  setSavedScrollPos,
  labelFunction,
  onSelected,
  disabled,
  style,
}: Props<T>) {
  const svRef = React.useRef<ScrollView>(null)
  const [scrollPos, _setScrollPos] = useState(0)
  const [isTickerMoving, setIsTickerMoving] = useState<boolean>(false)
  const [tickerAnim, setTickerAnim] = useState<Animated.CompositeAnimation>()
  const scrollVal = useAnimatedValue(0)
  const [scrollT, setScrollT] = useState<number>(0)
  //const pal = usePalette('primary')

  // Save the scroll pos whenever a button is pressed.
  const onWrapSelected = React.useCallback(
    (v: T) => {
      console.log('pressed', v)
      setIsTickerMoving(false)
      setSavedScrollPos(scrollPos)
      onSelected(v)
    },
    [onSelected, scrollPos, setSavedScrollPos],
  )

  // Mirror the shift AnimValue to the CPU.
  useEffect(() => {
    scrollVal.addListener(e => {
      setScrollT(e.value)
    })
  }, [scrollVal, setScrollT])

  // Scroll the view whenever the ticker parameter changes.
  useEffect(() => {
    svRef.current?.scrollTo({x: scrollT, animated: false})
  }, [scrollT])

  // Stop the animation when the isTickerMoving goes to false.
  useEffect(() => {
    if (!isTickerMoving) tickerAnim?.stop()
    else tickerAnim?.start()
  }, [tickerAnim, isTickerMoving])

  const onHaltTicker = useCallback(() => {
    console.log('======onHaltTicker')
    setIsTickerMoving(false)
  }, [])
  // const onResumeTicker = useCallback(() => {
  //   console.log('======onResumeTicker')
  //   setIsTickerMoving(true)
  // }, [])

  const onKickoffTicker = useCallback(
    async (w: number) => {
      setIsTickerMoving(true)
      const a: Animated.CompositeAnimation = Animated.timing(scrollVal, {
        toValue: w,
        duration: Math.floor((1000 * w) / TICKER_SPEED),
        useNativeDriver: false, // Must be false or else responsiveness decreases.
        easing: Easing.linear,
        delay: 2000,
      })
      a.start()
      setTickerAnim(a)
    },
    [scrollVal, setTickerAnim],
  )

  // const onTrackScrollPos = useCallback(
  //   (x: number) => {
  //     // Constrantly track the scroll position so that we can capture it when a button is pressed.
  //     setScrollPos(x)
  //     if (!isTickerMoving) scrollVal.setValue(x)
  //   },
  //   [isTickerMoving, scrollVal],
  // )

  if (options.length > 1)
    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={svRef}
        onContentSizeChange={(w: number, _h: number) => {
          onKickoffTicker(w)
          // svRef.current?.scrollTo({
          //   x: oldScrollPos,
          //   y: 0,
          //   animated: false,
          // })
        }}
        onTouchStart={onHaltTicker}
        // onMomentumScrollEnd={onResumeTicker}
        // onTouchEnd={onResumeTicker}
        scrollEventThrottle={50} // Sample scroll events every 50ms.
        // onScroll={event => {
        //   // onTrackScrollPos(event.nativeEvent.contentOffset.x)
        // }}
        style={[
          styles.containerMoreThan4,
          style,
          // pal.viewInvertedLight,
          disabled && s.op50,
        ]}
        contentContainerStyle={styles.contentContainer}>
        {options.map((option, i) => {
          const label = labelFunction(option)
          return (
            <SmartSmallButton
              key={`opt-${i}`}
              text={label}
              variant="dark"
              disabled={disabled}
              onPress={() => {
                onWrapSelected(option)
              }}
            />
          )
        })}
      </ScrollView>
    )
  else
    return (
      <View
        style={[
          styles.container4orLess,
          style,
          // pal.viewInvertedLight,
          disabled && s.op50,
        ]}>
        {options.map((option, i) => {
          const label = labelFunction(option)
          return (
            <SmartSmallButton
              key={`opt-${i}`}
              text={label}
              variant="dark"
              disabled={disabled}
              onPress={() => onSelected(option)}
            />
          )
        })}
      </View>
    )
}

const styles = StyleSheet.create({
  containerMoreThan4: {
    flexDirection: 'row',
    height: 38,
  },
  container4orLess: {
    flexDirection: 'row',
    height: 38,
    //gap: 12,
    justifyContent: 'space-between',
    width: '100%',
  },
  contentContainer: {
    gap: 12,
  },
  textButton: {
    padding: 10,
  },
})

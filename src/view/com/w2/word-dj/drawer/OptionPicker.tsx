import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  View,
  ScrollView,
} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {SmallButton} from './SmallButton'
import {s} from 'lib/styles'

interface Props<T> {
  options: readonly T[]
  selection: T
  oldScrollPos: number
  setSavedScrollPos: (sp: number) => void
  labelFunction: (option: T) => string
  onSelected: (option: T) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function OptionPicker<T>({
  options,
  selection,
  oldScrollPos,
  setSavedScrollPos,
  labelFunction,
  onSelected,
  disabled,
  style,
}: Props<T>) {
  const svRef = React.useRef<ScrollView>(null)
  const [scrollPos, setScrollPos] = React.useState(0)
  const pal = usePalette('primary')

  // Save the scroll pos whenever a button is pressed.
  const onWrapSelected = React.useCallback(
    (v: T) => {
      setSavedScrollPos(scrollPos)
      onSelected(v)
    },
    [scrollPos, onSelected, setSavedScrollPos],
  )

  if (options.length > 4)
    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ref={svRef}
        onContentSizeChange={() => {
          svRef.current?.scrollTo({
            x: oldScrollPos,
            y: 0,
            animated: false,
          })
        }}
        scrollEventThrottle={250} // Sample scroll events every 250ms.
        onScroll={event => {
          // Constrantly track the scroll position so that we can capture it when a button is pressed.
          const scrolling = event.nativeEvent.contentOffset.x
          setScrollPos(scrolling)
        }}
        style={[
          styles.container,
          style,
          pal.viewInvertedLight,
          disabled && s.op50,
        ]}>
        {options.map((option, i) => {
          const label = labelFunction(option)
          if (option === selection)
            return (
              <SmallButton
                key={`opt-${i}`}
                text={label}
                variant="dark"
                disabled={disabled}
                onPress={() => {
                  onWrapSelected(option)
                }}
              />
            )
          else
            return (
              <TextButton
                key={`opt-${i}`}
                text={label}
                disabled={disabled}
                onPress={() => onWrapSelected(option)}
              />
            )
        })}
      </ScrollView>
    )
  else
    return (
      <View
        style={[
          styles.container,
          style,
          pal.viewInvertedLight,
          disabled && s.op50,
        ]}>
        {options.map((option, i) => {
          const label = labelFunction(option)
          if (option === selection)
            return (
              <SmallButton
                key={`opt-${i}`}
                text={label}
                variant="dark"
                disabled={disabled}
                onPress={() => onSelected(option)}
              />
            )
          else
            return (
              <TextButton
                key={`opt-${i}`}
                text={label}
                disabled={disabled}
                onPress={() => onSelected(option)}
              />
            )
        })}
      </View>
    )
}

interface TextButtonProps {
  text: string
  disabled?: boolean
  onPress: () => void
}

const TextButton = ({text, disabled, onPress}: TextButtonProps) => {
  const pal = usePalette('primary')
  return (
    <TouchableOpacity
      style={styles.textButton}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}>
      <Text type="md" style={[pal.text]}>
        {text}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 38,
    borderRadius: 28,
  },
  textButton: {
    padding: 10,
  },
})

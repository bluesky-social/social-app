import React, {useRef} from 'react'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {View, StyleSheet, TextInput} from 'react-native'
import {SparkleIcon} from 'lib/icons-w2'
import {TouchableOpacity} from 'react-native-gesture-handler'
import {s, colors} from 'lib/styles'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {SmartBar} from './SmartBar'
import {useStyle} from 'lib/hooks/waverly/useStyle'

const INPUTROW_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

interface InputRowProps<T> {
  shiftVal: number
  viewRef: React.RefObject<View>
  query: string
  isInputFocused: boolean
  setIsInputFocused: (v: boolean) => void
  onChangeQuery: (v: string) => void
  onSubmitQuery: () => void
  onSparkleButton: () => void
  showSmartBar: boolean
  //setInputContentsHeight?: React.Dispatch<React.SetStateAction<number>>
  showBorder: boolean
  invertedColors: boolean
  smartOptions?: readonly T[]
  onSmartOptionSelected: (selection: T) => void
}

export function InputRow<T extends string>({
  shiftVal,
  viewRef,
  query,
  setIsInputFocused,
  onChangeQuery,
  onSubmitQuery,
  onSparkleButton,
  showSmartBar,
  //setInputContentsHeight,
  showBorder,
  invertedColors,
  smartOptions,
  onSmartOptionSelected,
}: InputRowProps<T>) {
  const theme = useTheme()
  const pal = usePalette('default')
  const safeAreainsets = useSafeAreaInsets()
  const shiftViewStyle = useStyle(
    () => ({
      position: 'absolute',
      bottom: safeAreainsets.bottom - shiftVal,
      width: '100%',
    }),
    [safeAreainsets.bottom, shiftVal],
  )
  const smartBarViewRef = useRef<View>(null)
  return (
    <View ref={viewRef} style={[s.flex1, s.flexCol, shiftViewStyle]}>
      {showSmartBar && (
        <SmartBar
          viewRef={smartBarViewRef}
          showBorder={false}
          smartOptions={smartOptions}
          onSmartOptionSelected={onSmartOptionSelected}
        />
      )}
      <View
        style={[
          pal.view,
          pal.border,
          showBorder && styles.border,
          styles.inputRowContainer,
          {
            backgroundColor: invertedColors
              ? pal.colors.white
              : pal.colors.backgroundLight,
          },
        ]}>
        <TouchableOpacity
          testID="waverlyChatSparkleButton"
          onPress={onSparkleButton}
          hitSlop={INPUTROW_HITSLOP}
          style={styles.inputRow_SparkleButton}
          accessibilityRole="button"
          accessibilityLabel="AI"
          accessibilityHint="Access Waverly AI">
          <SparkleIcon
            size={24}
            style={[pal.text, {color: colors.white}]}
            variant="filled"
          />
        </TouchableOpacity>
        <View
          style={[
            {
              backgroundColor: invertedColors
                ? pal.colors.backgroundLight
                : pal.colors.background,
            },
            styles.inputRow_SearchContainer,
          ]}>
          <TextInput
            testID="waverlyChatTextInput"
            placeholder="Enter a prompt..."
            placeholderTextColor={pal.colors.textLight}
            returnKeyType="default"
            value={query}
            multiline
            style={[
              pal.text,
              styles.intputRow_Input,
              invertedColors
                ? {backgroundColor: pal.colors.backgroundLight}
                : null,
            ]}
            keyboardAppearance={theme.colorScheme}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChangeText={onChangeQuery}
            onSubmitEditing={onSubmitQuery}
            // onContentSizeChange={e =>
            //   setInputContentsHeight?.(e.nativeEvent.contentSize.height)
            // }
            accessibilityLabel="Chat with Waverly"
            accessibilityHint=""
            autoCorrect={true}
            autoCapitalize="sentences"
          />
          {query && query.trim().length > 0 ? ( // Don't show the submit button until some text is present.
            <TouchableOpacity
              testID="waverlyChatSubmitButton"
              onPress={onSubmitQuery}
              hitSlop={INPUTROW_HITSLOP}
              accessibilityRole="button"
              accessibilityLabel="Submit chat"
              accessibilityHint="">
              <View style={styles.circleArrow}>
                <FontAwesomeIcon
                  icon="arrow-up"
                  size={15}
                  style={{color: colors.white} as FontAwesomeIconStyle}
                />
              </View>
            </TouchableOpacity>
          ) : undefined}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  inputRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputRow_SparkleButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.waverly1,
  },
  inputRow_SearchContainer: {
    flex: 1,
    flexDirection: 'row',
    //alignItems: 'center',
    alignItems: 'flex-end',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8, // Space between the text input and the submit button.
  },
  intputRow_Input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  border: {
    borderTopWidth: 1,
  },
  circleArrow: {
    width: 28,
    height: 28,
    borderRadius: 28 / 2,
    backgroundColor: colors.blue3,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

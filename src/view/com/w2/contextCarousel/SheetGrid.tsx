import React, {useCallback, useEffect, useState} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import {Text} from 'view/com/util/text/Text'
import {s, colors} from 'lib/styles'
import LinearGradient from 'react-native-linear-gradient'
import {ComposeIcon2, MagnifyingGlassIcon2} from 'lib/icons'
import {observer} from 'mobx-react-lite'
import {BottomSheetTextInput} from '@gorhom/bottom-sheet'
import {useTheme} from 'lib/ThemeContext'

interface GridButtonProps {
  testID?: string | undefined
  icon?: () => JSX.Element
  text: string
  onPress?: () => void
}
const GridButton = ({testID, icon, text, onPress}: GridButtonProps) => {
  return (
    <View style={cstyles.button}>
      <LinearGradient
        colors={['#FFFFFF', '#F3EDFF']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={cstyles.gradient}
      />
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        accessibilityRole="button">
        <View style={{flexDirection: 'row', gap: 6}}>
          {icon?.()}
          <Text
            type="sm"
            style={{justifyContent: 'center', alignSelf: 'center'}}>
            {text}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

////////////////////////////////////////////////////////////////////////////

const DrawComposeIcon = () => {
  const pal = usePalette('default')
  return <ComposeIcon2 strokeWidth={1.5} size={28} style={pal.text} />
}
const DrawMagnifyingGlassIcon2 = () => {
  const pal = usePalette('default')
  return <MagnifyingGlassIcon2 size={26} style={pal.text} strokeWidth={1.8} />
}
const DrawSwimmerEmoji = () => {
  return (
    <Text
      type="sm"
      style={{
        fontSize: 26,
        justifyContent: 'center',
        alignSelf: 'center',
      }}>
      🏊‍♀️
    </Text>
  )
}
interface InputFieldProps {
  onEnterTextInput: () => void
}
const InputField = ({onEnterTextInput}: InputFieldProps) => {
  return (
    <TouchableOpacity
      testID="carouselInputBtn"
      accessibilityRole="button"
      style={cstyles.inputFieldContainer}
      onPress={onEnterTextInput}>
      <Text
        type="lg"
        style={[s.flex1, s.textLeft, {marginLeft: 8}, {color: '#B896FF'}]}>
        Type another prompt...
      </Text>
    </TouchableOpacity>
  )
}

////////////////////////////////////////////////////////////////////////////

interface SheetGridProps {
  onEnterWordDJ: () => void
  onEnterWaverlyChat: () => void
  onToggleTextInput: (v: boolean) => void
  isUsingTextInput: boolean
  isInputFocused: boolean
  query: string
  setIsInputFocused: (v: boolean) => void
  onChangeQuery: (v: string) => void
  onSubmitQuery: () => void
}

export const SheetGrid = observer(function SheetGrid({
  onEnterWordDJ,
  onEnterWaverlyChat,
  onToggleTextInput,
  isUsingTextInput,
  isInputFocused,
  query,
  setIsInputFocused,
  onChangeQuery,
  onSubmitQuery,
}: SheetGridProps) {
  const theme = useTheme()
  const pal = usePalette('default')

  const [usingTextInput, setUsingTextInput] = useState<boolean>(false)
  const onEnterTextInputInt = useCallback(() => {
    onToggleTextInput(true)
    setUsingTextInput(true)
  }, [onToggleTextInput])
  const onExitTextInputInt = useCallback(() => {
    onToggleTextInput(false)
    setUsingTextInput(false)
    onSubmitQuery()
  }, [onSubmitQuery, onToggleTextInput])
  useEffect(() => {
    setUsingTextInput(isUsingTextInput)
  }, [isUsingTextInput])

  return (
    <View
      style={{
        paddingVertical: 16,
        paddingHorizontal: 16,
        flex: 1,
        gap: 16,
      }}>
      {usingTextInput && (
        <BottomSheetTextInput
          testID="carouselPromptInput"
          placeholder="Type another prompt..."
          placeholderTextColor={'#B896FF'}
          selectTextOnFocus
          value={query}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onChangeText={onChangeQuery}
          onSubmitEditing={onExitTextInputInt}
          // onSubmitEditing={onSubmitQuery}
          autoFocus={true}
          style={[
            theme.typography.lg,
            {
              alignSelf: 'stretch',
              height: 40,
              paddingHorizontal: 7,
              borderRadius: 12,
              borderColor: colors.waverly3,
              borderWidth: 2,
              backgroundColor: '#ffffff',
            },
            pal.text,
          ]}
        />
      )}
      {!usingTextInput && (
        <>
          <View style={{flexDirection: 'row', gap: 16}}>
            <GridButton
              testID="carouselFindMoreBtn"
              icon={DrawMagnifyingGlassIcon2}
              text={'Find more like this'}
            />
            <GridButton
              testID="carouselCreateBtn"
              icon={DrawComposeIcon}
              text={'Create from this'}
              onPress={onEnterWordDJ}
            />
          </View>
          <View style={{flexDirection: 'row', gap: 16}}>
            <GridButton
              testID="carouselShowLEssBtn"
              text={'🕊️ Show less like this'}
            />
            <GridButton
              testID="diveDeeperBtn"
              icon={DrawSwimmerEmoji}
              text={'Dive into the topic'}
              onPress={onEnterWaverlyChat}
            />
          </View>
          <InputField onEnterTextInput={onEnterTextInputInt} />
        </>
      )}
    </View>
  )
})

const cstyles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3EDFF',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    borderColor: colors.waverly3,
    backgroundColor: '#ffffff',
    borderWidth: 2,
  },
})

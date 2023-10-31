import React from 'react'
//import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {View, StyleSheet, ActivityIndicator} from 'react-native'
import {s} from 'lib/styles'
import {Text} from 'view/com/util/text/Text'
import {SmartOptionPicker} from './SmartOptionPicker'

const ANALYZING = 'Analyzing...'

interface SmartInfoRowProps<T> {
  smartOptions?: readonly T[]
  oldScrollPos: number
  setSavedScrollPos: (sp: number) => void
  disabled?: boolean
  //onOpen: () => void
  onSelected: (selection: T) => void
}

function SmartInfoRow<T extends string>({
  smartOptions,
  oldScrollPos,
  setSavedScrollPos,
  disabled,
  //onOpen,
  onSelected,
}: SmartInfoRowProps<T>) {
  const pal = usePalette('primary')
  return (
    <View style={styles.infoRow}>
      {smartOptions && smartOptions.length > 0 ? (
        <SmartOptionPicker<T>
          options={smartOptions}
          oldScrollPos={oldScrollPos}
          setSavedScrollPos={setSavedScrollPos}
          labelFunction={(t: T) => capitalize(t)}
          onSelected={onSelected}
          disabled={disabled}
          //style={s.flex1}
        />
      ) : (
        <View style={styles.analyzing}>
          <Text type="md" style={[pal.textLight]}>
            {ANALYZING}
          </Text>
          <ActivityIndicator size="small" color={pal.textLight.color} />
        </View>
      )}
    </View>
  )
}

function capitalize<T extends string>(option: T) {
  return option.charAt(0).toUpperCase() + option.slice(1)
}

const styles = StyleSheet.create({
  infoRow: {
    // height: 50, // No need to hardcode the height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  analyzing: {
    flexDirection: 'row',
    gap: 10,
  },
})

////////////////////////////////////////////////////////////////////////////////

interface SmartBarProps<T> {
  viewRef: React.RefObject<View>
  showBorder: boolean
  smartOptions?: readonly T[]
  onSmartOptionSelected: (selection: T) => void
}

export function SmartBar<T extends string>({
  viewRef,
  showBorder,
  smartOptions,
  onSmartOptionSelected,
}: SmartBarProps<T>) {
  //const theme = useTheme()
  const pal = usePalette('default')

  return (
    <View
      ref={viewRef}
      style={[
        pal.view,
        pal.border,
        showBorder && s.borderTop1,
        styles2.inputRowContainer,
        {
          backgroundColor: pal.colors.white,
        },
      ]}>
      <SmartInfoRow<T>
        smartOptions={smartOptions}
        //selection={'optionA'} //model.length}
        oldScrollPos={0} //lengthScrollPos}
        setSavedScrollPos={() => {}} //setSavedLengthScrollPos}
        //onOpen={() => {}} //model.openLength}
        onSelected={onSmartOptionSelected}
        //disabled={disableAll}
      />
    </View>
  )
}

const styles2 = StyleSheet.create({
  inputRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
})

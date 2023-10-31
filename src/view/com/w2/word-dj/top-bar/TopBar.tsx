import {usePalette} from 'lib/hooks/usePalette'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ModePicker} from './ModePicker'
import {WordDJMode} from 'state/models/w2/WordDJModel'
import {ButtonGroup, TextButton} from './ButtonGroup'

interface Props {
  disabled?: boolean
  canSwitchMode?: boolean

  onSetCurrentMode?: (newMode: WordDJMode) => void
  onClose?: () => void
  onNext?: () => void
  onDone?: () => void
}

export const TopBar = ({
  disabled,
  canSwitchMode,
  onSetCurrentMode,
  onClose,
  onNext,
  onDone,
}: Props) => {
  const pal = usePalette('default')

  return (
    <View style={[styles.container, pal.view]}>
      <ButtonGroup location="flex-start">
        {onClose && (
          <TextButton text="Close" disabled={disabled} onPress={onClose} />
        )}
      </ButtonGroup>
      <ModePicker
        disabled={disabled || !canSwitchMode}
        onSetCurrentMode={onSetCurrentMode}
      />
      <ButtonGroup location="flex-end">
        {onNext && (
          <TextButton
            emphasis={!onDone}
            text="Next"
            disabled={disabled}
            onPress={onNext}
          />
        )}
        {onDone && (
          <TextButton
            emphasis
            text="Done"
            disabled={disabled}
            onPress={onDone}
          />
        )}
      </ButtonGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexBasis: 0,
    flex: 1,
    gap: 16,
  },
})

import React from 'react'
import {View, StyleSheet, ActivityIndicator} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from 'view/com/util/text/Text'
import {SmallButton} from './SmallButton'
import {OptionPicker} from './OptionPicker'
import {s} from 'lib/styles'

const ANALYZING = 'Analyzing...'

interface InfoRowProps<T> {
  title?: string
  values: readonly T[]
  open: boolean
  useDarkButtons: boolean
  oldScrollPos: number
  setSavedScrollPos: (sp: number) => void
  selection?: T
  disabled?: boolean
  onOpen: () => void
  onSelected: (selection: T) => void
}

export function InfoRow<T extends string>({
  title,
  values,
  open,
  useDarkButtons,
  oldScrollPos,
  setSavedScrollPos,
  selection,
  disabled,
  onOpen,
  onSelected,
}: InfoRowProps<T>) {
  const pal = usePalette('primary')
  return (
    <View style={styles.infoRow}>
      {title && (
        <Text type="md" style={[pal.text]}>
          {title}
        </Text>
      )}
      {selection ? (
        open ? (
          <OptionPicker<T>
            options={values}
            selection={selection}
            oldScrollPos={oldScrollPos}
            setSavedScrollPos={setSavedScrollPos}
            style={title === undefined && s.flex1}
            onSelected={onSelected}
            labelFunction={(t: T) => capitalize(t)}
            disabled={disabled}
          />
        ) : disabled ? (
          <ActivityIndicator size="small" color={pal.textLight.color} />
        ) : useDarkButtons ? (
          <SmallButton
            text={capitalize(selection)}
            variant="dark"
            onPress={onOpen}
            disabled={disabled}
          />
        ) : (
          <SmallButton
            text={capitalize(selection)}
            onPress={onOpen}
            disabled={disabled}
          />
        )
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  analyzing: {
    flexDirection: 'row',
    gap: 10,
  },
})

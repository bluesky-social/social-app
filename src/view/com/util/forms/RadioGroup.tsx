import React, {useState} from 'react'
import {View} from 'react-native'
import {RadioButton} from './RadioButton'

export interface RadioGroupItem {
  label: string
  key: string
}

export function RadioGroup({
  items,
  onSelect,
}: {
  items: RadioGroupItem[]
  onSelect: (key: string) => void
}) {
  const [selection, setSelection] = useState<string>('')
  const onSelectInner = (key: string) => {
    setSelection(key)
    onSelect(key)
  }
  return (
    <View>
      {items.map(item => (
        <RadioButton
          key={item.key}
          label={item.label}
          isSelected={item.key === selection}
          onPress={() => onSelectInner(item.key)}
        />
      ))}
    </View>
  )
}

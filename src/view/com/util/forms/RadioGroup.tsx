import React, {useState} from 'react'
import {View} from 'react-native'
import {RadioButton} from './RadioButton'
import {ButtonType} from './Button'
import {s} from 'lib/styles'

export interface RadioGroupItem {
  label: string
  key: string
}

export function RadioGroup({
  type,
  items,
  initialSelection = '',
  onSelect,
}: {
  type?: ButtonType
  items: RadioGroupItem[]
  initialSelection?: string
  onSelect: (key: string) => void
}) {
  const [selection, setSelection] = useState<string>(initialSelection)
  const onSelectInner = (key: string) => {
    setSelection(key)
    onSelect(key)
  }
  return (
    <View>
      {items.map((item, i) => (
        <RadioButton
          key={item.key}
          style={i !== 0 ? s.mt2 : undefined}
          type={type}
          label={item.label}
          isSelected={item.key === selection}
          onPress={() => onSelectInner(item.key)}
        />
      ))}
    </View>
  )
}

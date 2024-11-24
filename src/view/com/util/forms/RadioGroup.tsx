import {useState} from 'react'
import {View} from 'react-native'

import {s} from '#/lib/styles'
import {ButtonType} from './Button'
import {RadioButton} from './RadioButton'

export interface RadioGroupItem {
  label: string | JSX.Element
  key: string
}

export function RadioGroup({
  testID,
  type,
  items,
  initialSelection = '',
  onSelect,
}: {
  testID?: string
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
          testID={testID ? `${testID}-${item.key}` : undefined}
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

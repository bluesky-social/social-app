import React from 'react'
import {Pressable, TextInput, View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function ClopInput({onSendClop}: {onSendClop: (clop: string) => void}) {
  const t = useTheme()

  const [clop, setClop] = React.useState('')

  const onSubmit = React.useCallback(() => {
    onSendClop(clop)
    setClop('')
  }, [clop, onSendClop])

  return (
    <View
      style={[
        a.flex_row,
        a.py_sm,
        a.px_sm,
        a.rounded_full,
        a.mt_sm,
        t.atoms.bg_contrast_25,
      ]}>
      <TextInput
        accessibilityLabel="Text input field"
        accessibilityHint="Write a clop"
        value={clop}
        onChangeText={setClop}
        placeholder="Write a clop"
        style={[a.flex_1, a.text_sm, a.px_sm]}
        onSubmitEditing={onSubmit}
        placeholderTextColor={t.palette.contrast_500}
      />
      <Pressable
        accessibilityRole="button"
        style={[
          a.rounded_full,
          a.align_center,
          a.justify_center,
          {height: 30, width: 30, backgroundColor: t.palette.primary_500},
        ]}
        onPress={onSubmit}>
        <Text style={a.text_md}>🐴</Text>
      </Pressable>
    </View>
  )
}

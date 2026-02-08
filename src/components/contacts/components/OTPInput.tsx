import {useRef, useState} from 'react'
import {
  Pressable,
  TextInput,
  type TextInputSelectionChangeEvent,
  View,
} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {mergeRefs} from '#/lib/merge-refs'
import {atoms as a, ios, platform, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Text} from '#/components/Typography'
import {IS_ANDROID, IS_IOS} from '#/env'

export function OTPInput({
  label,
  value,
  onChange,
  ref,
  numberOfDigits = 6,
  onComplete,
}: {
  label: string
  value: string
  onChange: (text: string) => void
  ref?: React.Ref<TextInput>
  numberOfDigits?: number
  onComplete?: (code: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const innerRef = useRef<TextInput>(null)
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const [selection, setSelection] = useState({start: 0, end: 0})

  const onChangeText = (text: string) => {
    // only numbers
    text = text.replace(/[^0-9]/g, '')
    text = text.slice(0, numberOfDigits)
    onChange(text)
    if (text.length === numberOfDigits) {
      onComplete?.(text)
      innerRef.current?.blur()
    }
  }

  const onSelectionChange = (evt: TextInputSelectionChangeEvent) => {
    setSelection(evt.nativeEvent.selection)
  }

  return (
    <Pressable
      accessibilityLabel={_(msg`Focus code input`)}
      accessibilityRole="button"
      accessibilityHint=""
      style={[a.w_full, a.relative]}
      onPress={() => {
        innerRef.current?.focus()
        innerRef.current?.clear()
      }}>
      <View style={[a.w_full, a.flex_row, a.gap_sm]}>
        {[...value.padEnd(numberOfDigits, ' ')].map((digit, index) => {
          const selected = focused
            ? selection.start === selection.end
              ? selection.start === index
              : index >= selection.start && index < selection.end
            : false

          return (
            <View
              key={index}
              style={[
                a.flex_1,
                a.align_center,
                a.justify_center,
                t.atoms.bg_contrast_50,
                {
                  height: 64,
                  borderWidth: 1,
                  borderRadius: 10,
                  borderColor: selected
                    ? t.palette.primary_500
                    : t.atoms.bg_contrast_50.backgroundColor,
                },
              ]}>
              <Text style={[a.text_2xl, a.text_center, a.font_bold]}>
                {digit}
              </Text>
            </View>
          )
        })}
      </View>
      <TextInput
        // SMS autofill is borked on iOS if you open the keyboard immediately -sfn
        onLayout={ios(() => setTimeout(() => innerRef.current?.focus(), 100))}
        autoFocus={IS_ANDROID}
        accessible
        accessibilityLabel={label}
        accessibilityHint=""
        accessibilityRole="text"
        ref={mergeRefs(ref ? [ref, innerRef] : [innerRef])}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={onSelectionChange}
        keyboardAppearance={t.scheme}
        inputMode="numeric"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={platform({
          android: 'sms-otp',
          ios: 'one-time-code',
        })}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={numberOfDigits}
        style={[
          a.absolute,
          a.inset_0,
          // roughly vibe align the characters
          // with the visible ones so that
          // moving the caret via long press
          // still kinda sorta works
          {
            fontVariant: ['tabular-nums'],
            textAlignVertical: 'center',
            letterSpacing: 24,
            fontSize: 60,
            paddingLeft: 6,
          },
          platform({
            // completely transparent inputs on iOS cannot be pasted into
            ios: {opacity: 0.02, color: 'transparent'},
            android: {opacity: 0},
          }),
        ]}
        caretHidden={IS_IOS}
        clearTextOnFocus
      />
    </Pressable>
  )
}

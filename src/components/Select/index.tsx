import React, {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Button, ButtonIcon, ButtonText} from '../Button'
import {useInteractionState} from '../hooks/useInteractionState'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '../icons/Check'
import {ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon} from '../icons/Chevron'
import {Text} from '../Typography'
import {
  ContentProps,
  ItemIndicatorProps,
  ItemProps,
  ItemTextProps,
  RootProps,
  TriggerProps,
  ValueProps,
} from './types'

type ContextType = {
  control: Dialog.DialogControlProps
} & Pick<RootProps, 'value' | 'onValueChange' | 'disabled'>

const Context = React.createContext<ContextType | null>(null)

function useSelectContext() {
  const ctx = React.useContext(Context)
  if (!ctx) {
    throw new Error('Select components must must be used within a Select.Root')
  }
  return ctx
}

export function Root({children, value, onValueChange, disabled}: RootProps) {
  const control = Dialog.useDialogControl()
  const ctx = useMemo(
    () => ({
      control,
      value,
      onValueChange,
      disabled,
    }),
    [control, value, onValueChange, disabled],
  )
  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export function Trigger({children, label}: TriggerProps) {
  const {control} = useSelectContext()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()

  if (typeof children === 'function') {
    return children({
      isNative: true,
      control,
      state: {
        hovered: false,
        focused,
        pressed,
      },
      props: {
        onPress: control.open,
        onFocus,
        onBlur,
        onPressIn,
        onPressOut,
        accessibilityLabel: label,
      },
    })
  } else {
    return (
      <Button
        label={label}
        onPress={control.open}
        style={[a.flex_1, a.justify_between]}
        color="secondary"
        size="small"
        variant="solid">
        <>{children}</>
      </Button>
    )
  }
}

export function ValueText({placeholder, children}: ValueProps) {
  const t = useTheme()
  return (
    <ButtonText style={[t.atoms.text]}>{children || placeholder}</ButtonText>
  )
}

export function Icon() {
  return <ButtonIcon icon={ChevronUpDownIcon} />
}

export function Content<T>(props: ContentProps<T>) {
  const {control, ...context} = useSelectContext()

  return (
    <Dialog.Outer control={control}>
      <ContentInner control={control} {...props} {...context} />
    </Dialog.Outer>
  )
}

function ContentInner<T>({
  items,
  renderItem,
  ...context
}: ContentProps<T> & ContextType) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const [headerHeight, setHeaderHeight] = useState(50)

  const render = React.useCallback(
    ({item, index}: {item: T; index: number}) => {
      return renderItem(item, index)
    },
    [renderItem],
  )

  const doneButton = useCallback(
    () => (
      <Button
        label={_(msg`Done`)}
        onPress={() => control.close()}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}>
        <ButtonText style={[a.text_md]}>
          <Trans>Done</Trans>
        </ButtonText>
      </Button>
    ),
    [control, _],
  )

  return (
    <Context.Provider value={context}>
      <Dialog.Header
        renderRight={doneButton}
        onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}
        style={[a.absolute, a.top_0, a.left_0, a.right_0, a.z_10]}>
        <Dialog.HeaderText>
          <Trans>Select an option</Trans>
        </Dialog.HeaderText>
      </Dialog.Header>
      <Dialog.InnerFlatList
        headerOffset={headerHeight}
        data={items}
        renderItem={render}
      />
    </Context.Provider>
  )
}

const ItemContext = React.createContext<{
  selected: boolean
  hovered: boolean
  focused: boolean
  pressed: boolean
}>({
  selected: false,
  hovered: false,
  focused: false,
  pressed: false,
})

export function useItemContext() {
  return React.useContext(ItemContext)
}

export function Item({children, value, label}: ItemProps) {
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const {value: selected, onValueChange} = useSelectContext()

  return (
    <Button
      role="listitem"
      label={label}
      style={[a.flex_1]}
      onPress={() => {
        control.close(() => {
          onValueChange?.(value)
        })
      }}>
      {({hovered, focused, pressed}) => (
        <ItemContext.Provider
          value={{selected: value === selected, hovered, focused, pressed}}>
          <View
            style={[
              a.flex_1,
              a.px_lg,
              (focused || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <View
              style={[
                a.flex_1,
                a.flex_row,
                a.py_md,
                a.justify_between,
                a.align_center,
                a.border_b,
                t.atoms.border_contrast_low,
              ]}>
              {children}
            </View>
          </View>
        </ItemContext.Provider>
      )}
    </Button>
  )
}

export function ItemText({children}: ItemTextProps) {
  return <Text style={[a.text_md]}>{children}</Text>
}

export function ItemIndicator({icon: Icon = CheckIcon}: ItemIndicatorProps) {
  const {selected} = useItemContext()
  if (!selected) return null
  return <Icon size="md" />
}

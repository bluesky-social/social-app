import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {BaseRadio} from '../forms/Toggle'
import {
  type ContentProps,
  type IconProps,
  type ItemIndicatorProps,
  type ItemProps,
  type ItemTextProps,
  type RootProps,
  type TriggerProps,
  type ValueProps,
} from './types'

type ContextType = {
  control: Dialog.DialogControlProps
} & Pick<RootProps, 'value' | 'onValueChange' | 'disabled'>

const Context = createContext<ContextType | null>(null)
Context.displayName = 'SelectContext'

const ValueTextContext = createContext<
  [any, React.Dispatch<React.SetStateAction<any>>]
>([undefined, () => {}])
ValueTextContext.displayName = 'ValueTextContext'

function useSelectContext() {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error('Select components must must be used within a Select.Root')
  }
  return ctx
}

export function Root({children, value, onValueChange, disabled}: RootProps) {
  const control = Dialog.useDialogControl()
  const valueTextCtx = useState<any>()

  const ctx = useMemo(
    () => ({
      control,
      value,
      onValueChange,
      disabled,
    }),
    [control, value, onValueChange, disabled],
  )
  return (
    <Context.Provider value={ctx}>
      <ValueTextContext.Provider value={valueTextCtx}>
        {children}
      </ValueTextContext.Provider>
    </Context.Provider>
  )
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
        shape="rectangular">
        <>{children}</>
      </Button>
    )
  }
}

export function ValueText({
  placeholder,
  children = value => value.label,
  style,
}: ValueProps) {
  const [value] = useContext(ValueTextContext)
  const t = useTheme()

  let text = value && children(value)
  if (!text) text = placeholder

  return (
    <ButtonText style={[t.atoms.text, a.font_normal, style]} emoji>
      {text}
    </ButtonText>
  )
}

export function Icon({}: IconProps) {
  return <ButtonIcon icon={ChevronUpDownIcon} />
}

export function Content<T>({
  items,
  valueExtractor = defaultItemValueExtractor,
  ...props
}: ContentProps<T>) {
  const {control, ...context} = useSelectContext()
  const [, setValue] = useContext(ValueTextContext)

  useLayoutEffect(() => {
    const item = items.find(item => valueExtractor(item) === context.value)
    if (item) {
      setValue(item)
    }
  }, [items, context.value, valueExtractor, setValue])

  return (
    <Dialog.Outer control={control}>
      <ContentInner
        control={control}
        items={items}
        valueExtractor={valueExtractor}
        {...props}
        {...context}
      />
    </Dialog.Outer>
  )
}

function ContentInner<T>({
  label,
  items,
  renderItem,
  valueExtractor,
  ...context
}: ContentProps<T> & ContextType) {
  const {_} = useLingui()
  const [headerHeight, setHeaderHeight] = useState(61)

  const render = useCallback(
    ({item, index}: {item: T; index: number}) => {
      return renderItem(item, index, context.value)
    },
    [renderItem, context.value],
  )

  return (
    <Context.Provider value={context}>
      <Dialog.Header
        onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}
        style={[
          a.absolute,
          a.top_0,
          a.left_0,
          a.right_0,
          a.z_10,
          a.pt_3xl,
          a.pb_sm,
          a.border_b_0,
        ]}>
        <Dialog.HeaderText
          style={[a.flex_1, a.px_xl, a.text_left, a.font_bold, a.text_2xl]}>
          {label ?? _(msg`Select an option`)}
        </Dialog.HeaderText>
      </Dialog.Header>
      <Dialog.Handle />
      <Dialog.InnerFlatList
        headerOffset={headerHeight}
        data={items}
        renderItem={render}
        keyExtractor={valueExtractor}
      />
    </Context.Provider>
  )
}

function defaultItemValueExtractor(item: any) {
  return item.value
}

const ItemContext = createContext<{
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
ItemContext.displayName = 'SelectItemContext'

export function useItemContext() {
  return useContext(ItemContext)
}

export function Item({children, value, label, style}: ItemProps) {
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
              a.px_xl,
              (focused || pressed) && t.atoms.bg_contrast_25,
              a.flex_row,
              a.align_center,
              a.gap_sm,
              a.py_md,
              style,
            ]}>
            {children}
          </View>
        </ItemContext.Provider>
      )}
    </Button>
  )
}

export function ItemText({children, style, emoji}: ItemTextProps) {
  const {selected} = useItemContext()

  return (
    <Text
      style={[a.text_md, selected && a.font_semi_bold, style]}
      emoji={emoji}>
      {children}
    </Text>
  )
}

export function ItemIndicator({icon: Icon}: ItemIndicatorProps) {
  const {selected, focused, hovered} = useItemContext()

  if (Icon) {
    return <View style={{width: 24}}>{selected && <Icon size="md" />}</View>
  }

  return (
    <BaseRadio
      selected={selected}
      focused={focused}
      hovered={hovered}
      isInvalid={false}
      disabled={false}
    />
  )
}

export function Separator() {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.border_b,
        t.atoms.border_contrast_low,
        a.mx_xl,
        a.my_xs,
      ]}
    />
  )
}

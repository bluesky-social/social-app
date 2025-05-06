import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {ChevronTopBottom_Stroke2_Corner0_Rounded as ChevronUpDownIcon} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
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

const ValueTextContext = createContext<
  [any, React.Dispatch<React.SetStateAction<any>>]
>([undefined, () => {}])

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
        variant="solid">
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
  if (typeof text !== 'string') text = placeholder

  return (
    <ButtonText style={[t.atoms.text, a.font_normal, style]}>{text}</ButtonText>
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
  items,
  renderItem,
  valueExtractor,
  ...context
}: ContentProps<T> & ContextType) {
  const control = Dialog.useDialogContext()

  const {_} = useLingui()
  const [headerHeight, setHeaderHeight] = useState(50)

  const render = useCallback(
    ({item, index}: {item: T; index: number}) => {
      return renderItem(item, index, context.value)
    },
    [renderItem, context.value],
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
              a.pl_md,
              (focused || pressed) && t.atoms.bg_contrast_25,
              a.flex_row,
              a.align_center,
              a.gap_sm,
              style,
            ]}>
            {children}
          </View>
        </ItemContext.Provider>
      )}
    </Button>
  )
}

export function ItemText({children}: ItemTextProps) {
  const {selected} = useItemContext()
  const t = useTheme()

  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <View style={[a.flex_1, a.py_md, a.border_b, t.atoms.border_contrast_low]}>
      <Text style={[a.text_md, selected && a.font_bold]}>{children}</Text>
    </View>
  )
}

export function ItemIndicator({icon: Icon = CheckIcon}: ItemIndicatorProps) {
  const {selected} = useItemContext()

  return <View style={{width: 24}}>{selected && <Icon size="md" />}</View>
}

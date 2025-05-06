import {createContext, forwardRef, useContext, useMemo} from 'react'
import {View} from 'react-native'
import {Select as RadixSelect} from 'radix-ui'

import {flatten, useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {Text} from '#/components/Typography'
import {
  type ContentProps,
  type IconProps,
  type ItemIndicatorProps,
  type ItemProps,
  type RadixPassThroughTriggerProps,
  type RootProps,
  type TriggerProps,
  type ValueProps,
} from './types'

const SelectedValueContext = createContext<string | undefined | null>(null)

export function Root(props: RootProps) {
  return (
    <SelectedValueContext.Provider value={props.value}>
      <RadixSelect.Root {...props} />
    </SelectedValueContext.Provider>
  )
}

const RadixTriggerPassThrough = forwardRef(
  (
    props: {
      children: (
        props: RadixPassThroughTriggerProps & {
          ref: React.Ref<any>
        },
      ) => React.ReactNode
    },
    ref,
  ) => {
    // @ts-expect-error Radix provides no types of this stuff

    return props.children?.({...props, ref})
  },
)
RadixTriggerPassThrough.displayName = 'RadixTriggerPassThrough'

export function Trigger({children, label}: TriggerProps) {
  const t = useTheme()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  if (typeof children === 'function') {
    return (
      <RadixSelect.Trigger asChild>
        <RadixTriggerPassThrough>
          {props =>
            children({
              isNative: false,
              state: {
                hovered,
                focused,
                pressed: false,
              },
              props: {
                ...props,
                onFocus: onFocus,
                onBlur: onBlur,
                onMouseEnter,
                onMouseLeave,
                accessibilityLabel: label,
              },
            })
          }
        </RadixTriggerPassThrough>
      </RadixSelect.Trigger>
    )
  } else {
    return (
      <RadixSelect.Trigger
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={flatten([
          a.flex,
          a.relative,
          t.atoms.bg_contrast_25,
          a.rounded_sm,
          a.w_full,
          {maxWidth: 400},
          a.align_center,
          a.gap_sm,
          a.justify_between,
          a.py_sm,
          a.px_md,
          {
            outline: 0,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: focused
              ? t.palette.primary_500
              : hovered
              ? t.palette.contrast_100
              : t.palette.contrast_25,
          },
        ])}>
        {children}
      </RadixSelect.Trigger>
    )
  }
}

export function ValueText({children: _, style, ...props}: ValueProps) {
  return (
    <Text style={style}>
      <RadixSelect.Value {...props} />
    </Text>
  )
}

export function Icon({style}: IconProps) {
  const t = useTheme()
  return (
    <RadixSelect.Icon>
      <ChevronDownIcon style={[t.atoms.text, style]} size="xs" />
    </RadixSelect.Icon>
  )
}

export function Content<T>({items, renderItem}: ContentProps<T>) {
  const t = useTheme()
  const selectedValue = useContext(SelectedValueContext)

  const scrollBtnStyles: React.CSSProperties[] = [
    a.absolute,
    a.flex,
    a.align_center,
    a.justify_center,
    a.rounded_sm,
    a.z_10,
  ]
  const up: React.CSSProperties[] = [
    ...scrollBtnStyles,
    a.pt_sm,
    a.pb_lg,
    {
      top: 0,
      left: 0,
      right: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      background: `linear-gradient(to bottom, ${t.atoms.bg.backgroundColor} 0%, transparent 100%)`,
    },
  ]
  const down: React.CSSProperties[] = [
    ...scrollBtnStyles,
    a.pt_lg,
    a.pb_sm,
    {
      bottom: 0,
      left: 0,
      right: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      background: `linear-gradient(to top, ${t.atoms.bg.backgroundColor} 0%, transparent 100%)`,
    },
  ]

  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        style={flatten([t.atoms.bg, a.rounded_sm, a.overflow_hidden])}
        position="popper"
        sideOffset={5}
        className="radix-select-content">
        <View
          style={[
            a.flex_1,
            a.border,
            t.atoms.border_contrast_low,
            a.rounded_sm,
          ]}>
          <RadixSelect.ScrollUpButton style={flatten(up)}>
            <ChevronUpIcon style={[t.atoms.text]} size="xs" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport style={flatten([a.p_xs])}>
            {items.map((item, index) => renderItem(item, index, selectedValue))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton style={flatten(down)}>
            <ChevronDownIcon style={[t.atoms.text]} size="xs" />
          </RadixSelect.ScrollDownButton>
        </View>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}

const ItemContext = createContext<{
  hovered: boolean
  focused: boolean
  pressed: boolean
  selected: boolean
}>({
  hovered: false,
  focused: false,
  pressed: false,
  selected: false,
})

export function useItemContext() {
  return useContext(ItemContext)
}

export function Item({ref, value, style, children}: ItemProps) {
  const t = useTheme()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const selected = useContext(SelectedValueContext) === value
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const ctx = useMemo(
    () => ({hovered, focused, pressed: false, selected}),
    [hovered, focused, selected],
  )
  return (
    <RadixSelect.Item
      ref={ref}
      value={value}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      style={flatten([
        a.relative,
        a.flex,
        {minHeight: 25, paddingLeft: 30, paddingRight: 35},
        a.user_select_none,
        a.align_center,
        a.rounded_xs,
        a.py_2xs,
        a.text_sm,
        {outline: 0},
        (hovered || focused) && {backgroundColor: t.palette.primary_50},
        selected && [a.font_bold],
        a.transition_color,
        style,
      ])}>
      <ItemContext.Provider value={ctx}>{children}</ItemContext.Provider>
    </RadixSelect.Item>
  )
}

export const ItemText = RadixSelect.ItemText

export function ItemIndicator({icon: Icon = CheckIcon}: ItemIndicatorProps) {
  return (
    <RadixSelect.ItemIndicator
      style={flatten([
        a.absolute,
        {left: 0, width: 30},
        a.flex,
        a.align_center,
        a.justify_center,
      ])}>
      <Icon size="sm" />
    </RadixSelect.ItemIndicator>
  )
}

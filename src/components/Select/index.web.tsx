import React, {useContext, useMemo} from 'react'
import * as RadixSelect from '@radix-ui/react-select'

import {flatten, useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import {
  ContentProps,
  ItemIndicatorProps,
  ItemProps,
  RadixPassThroughTriggerProps,
  RootProps,
  TriggerProps,
  ValueProps,
} from './types'

const SelectedValueContext = React.createContext<unknown>(null)

export function Root(props: RootProps) {
  return (
    <SelectedValueContext.Provider value={props.value}>
      <RadixSelect.Root {...props} />
    </SelectedValueContext.Provider>
  )
}

const RadixTriggerPassThrough = React.forwardRef(
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

export function ValueText(props: ValueProps) {
  return <RadixSelect.Value {...props} />
}

export function Icon() {
  const t = useTheme()
  return (
    <RadixSelect.Icon>
      <ChevronDownIcon style={[t.atoms.text]} size="xs" />
    </RadixSelect.Icon>
  )
}

export function Content<T>({items, renderItem}: ContentProps<T>) {
  const t = useTheme()
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        style={flatten([
          t.atoms.bg,
          a.border,
          t.atoms.border_contrast_medium,
          a.rounded_sm,
          a.overflow_hidden,
        ])}
        position="popper"
        sideOffset={5}
        className="radix-select-content">
        <RadixSelect.ScrollUpButton
          style={flatten([
            a.flex,
            {height: 25},
            a.align_center,
            a.justify_center,
            t.atoms.bg,
          ])}>
          <ChevronUpIcon style={[t.atoms.text]} />
        </RadixSelect.ScrollUpButton>
        <RadixSelect.Viewport style={flatten([a.p_xs])}>
          {items.map((item, index) => renderItem(item, index))}
        </RadixSelect.Viewport>
        <RadixSelect.ScrollDownButton
          style={flatten([
            a.flex,
            {height: 25},
            a.align_center,
            a.justify_center,
            t.atoms.bg,
          ])}>
          <ChevronDownIcon style={[t.atoms.text]} />
        </RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}

const ItemContext = React.createContext<{
  hovered: boolean
  focused: boolean
  pressed: boolean
}>({
  hovered: false,
  focused: false,
  pressed: false,
})

export function useItemContext() {
  return React.useContext(ItemContext)
}

export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({value, children}, ref) => {
    const t = useTheme()
    const {
      state: hovered,
      onIn: onMouseEnter,
      onOut: onMouseLeave,
    } = useInteractionState()
    const isSelected = useContext(SelectedValueContext) === value
    const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
    const ctx = useMemo(
      () => ({hovered, focused, pressed: false}),
      [hovered, focused],
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
          isSelected && [a.font_bold, {backgroundColor: t.palette.primary_50}],
          (hovered || focused) && [
            {backgroundColor: t.palette.primary_400, color: t.palette.white},
          ],
          a.transition_color,
        ])}>
        <ItemContext.Provider value={ctx}>{children}</ItemContext.Provider>
      </RadixSelect.Item>
    )
  },
)
Item.displayName = 'SelectItem'

export const ItemText = RadixSelect.ItemText

export function ItemIndicator({icon: Icon = CheckIcon}: ItemIndicatorProps) {
  const t = useTheme()
  const {hovered, focused} = useItemContext()
  return (
    <RadixSelect.ItemIndicator
      style={flatten([
        a.absolute,
        {left: 0, width: 30},
        a.flex,
        a.align_center,
        a.justify_center,
      ])}>
      <Icon
        size="sm"
        fill={hovered || focused ? t.palette.white : t.palette.primary_500}
      />
    </RadixSelect.ItemIndicator>
  )
}

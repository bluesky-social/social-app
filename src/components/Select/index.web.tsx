import {createContext, forwardRef, Fragment, useContext, useMemo} from 'react'
import {View} from 'react-native'
import {Select as RadixSelect} from 'radix-ui'

import {useA11y} from '#/state/a11y'
import {flatten, useTheme, web} from '#/alf'
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
  type ItemTextProps,
  type RadixPassThroughTriggerProps,
  type RootProps,
  type TriggerProps,
  type ValueProps,
} from './types'

const SelectedValueContext = createContext<string | undefined | null>(null)
SelectedValueContext.displayName = 'SelectSelectedValueContext'

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
              IS_NATIVE: false,
              state: {
                hovered,
                focused,
                pressed: false,
              },
              props: {
                ...props,
                onPress: props.onClick,
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
          t.atoms.bg_contrast_50,
          a.align_center,
          a.gap_sm,
          a.justify_between,
          a.py_sm,
          a.px_md,
          a.pointer,
          {
            borderRadius: 10,
            maxWidth: 400,
            outline: 0,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: focused
              ? t.palette.primary_500
              : t.palette.contrast_50,
          },
        ])}>
        {children}
      </RadixSelect.Trigger>
    )
  }
}

export function ValueText({
  children,
  webOverrideValue,
  style,
  ...props
}: ValueProps) {
  let content

  if (webOverrideValue && children) {
    content = children(webOverrideValue)
  }

  return (
    <Text style={style}>
      <RadixSelect.Value {...props}>{content}</RadixSelect.Value>
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

export function Content<T>({
  items,
  renderItem,
  valueExtractor = defaultItemValueExtractor,
}: ContentProps<T>) {
  const t = useTheme()
  const selectedValue = useContext(SelectedValueContext)
  const {reduceMotionEnabled} = useA11y()

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
        align="center"
        sideOffset={5}
        className="radix-select-content"
        // prevent the keyboard shortcut for opening the composer
        onKeyDown={evt => evt.stopPropagation()}>
        <View
          style={[
            a.flex_1,
            a.border,
            t.atoms.border_contrast_low,
            a.rounded_sm,
            a.overflow_hidden,
            !reduceMotionEnabled && a.zoom_fade_in,
          ]}>
          <RadixSelect.ScrollUpButton style={flatten(up)}>
            <ChevronUpIcon style={[t.atoms.text]} size="xs" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport style={flatten([a.p_xs])}>
            {items.map((item, index) => (
              <Fragment key={valueExtractor(item)}>
                {renderItem(item, index, selectedValue)}
              </Fragment>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton style={flatten(down)}>
            <ChevronDownIcon style={[t.atoms.text]} size="xs" />
          </RadixSelect.ScrollDownButton>
        </View>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}

function defaultItemValueExtractor(item: any) {
  return item.value
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
ItemContext.displayName = 'SelectItemContext'

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
        t.atoms.text,
        a.relative,
        a.flex,
        {minHeight: 25, paddingLeft: 30, paddingRight: 8},
        a.user_select_none,
        a.align_center,
        a.rounded_xs,
        a.py_2xs,
        a.text_sm,
        {outline: 0},
        (hovered || focused) && {backgroundColor: t.palette.primary_50},
        selected && [a.font_semi_bold],
        a.transition_color,
        style,
      ])}>
      <ItemContext.Provider value={ctx}>{children}</ItemContext.Provider>
    </RadixSelect.Item>
  )
}

export const ItemText = function ItemText({children, style}: ItemTextProps) {
  return (
    <RadixSelect.ItemText asChild>
      <Text style={flatten([style, web({pointerEvents: 'inherit'})])}>
        {children}
      </Text>
    </RadixSelect.ItemText>
  )
}

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

export function Separator() {
  const t = useTheme()

  return (
    <RadixSelect.Separator
      style={flatten([
        {
          height: 1,
          backgroundColor: t.atoms.border_contrast_low.borderColor,
        },
        a.my_xs,
        a.w_full,
      ])}
    />
  )
}

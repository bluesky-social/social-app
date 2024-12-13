import React from 'react'
import {Pressable, View, ViewStyle} from 'react-native'
import Animated, {LinearTransition} from 'react-native-reanimated'

import {HITSLOP_10} from '#/lib/constants'
import {isNative} from '#/platform/detection'
import {
  atoms as a,
  flatten,
  native,
  TextStyleProp,
  useTheme,
  ViewStyleProp,
} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {CheckThick_Stroke2_Corner0_Rounded as Checkmark} from '#/components/icons/Check'
import {Text} from '#/components/Typography'

export type ItemState = {
  name: string
  selected: boolean
  disabled: boolean
  isInvalid: boolean
  hovered: boolean
  pressed: boolean
  focused: boolean
}

const ItemContext = React.createContext<ItemState>({
  name: '',
  selected: false,
  disabled: false,
  isInvalid: false,
  hovered: false,
  pressed: false,
  focused: false,
})

const GroupContext = React.createContext<{
  values: string[]
  disabled: boolean
  type: 'radio' | 'checkbox'
  maxSelectionsReached: boolean
  setFieldValue: (props: {name: string; value: boolean}) => void
}>({
  type: 'checkbox',
  values: [],
  disabled: false,
  maxSelectionsReached: false,
  setFieldValue: () => {},
})

export type GroupProps = React.PropsWithChildren<{
  type?: 'radio' | 'checkbox'
  values: string[]
  maxSelections?: number
  disabled?: boolean
  onChange: (value: string[]) => void
  label: string
}>

export type ItemProps = ViewStyleProp & {
  type?: 'radio' | 'checkbox'
  name: string
  label: string
  value?: boolean
  disabled?: boolean
  onChange?: (selected: boolean) => void
  isInvalid?: boolean
  children: ((props: ItemState) => React.ReactNode) | React.ReactNode
}

export function useItemContext() {
  return React.useContext(ItemContext)
}

export function Group({
  children,
  values: providedValues,
  onChange,
  disabled = false,
  type = 'checkbox',
  maxSelections,
  label,
}: GroupProps) {
  const groupRole = type === 'radio' ? 'radiogroup' : undefined
  const values = type === 'radio' ? providedValues.slice(0, 1) : providedValues
  const [maxReached, setMaxReached] = React.useState(false)

  const setFieldValue = React.useCallback<
    (props: {name: string; value: boolean}) => void
  >(
    ({name, value}) => {
      if (type === 'checkbox') {
        const pruned = values.filter(v => v !== name)
        const next = value ? pruned.concat(name) : pruned
        onChange(next)
      } else {
        onChange([name])
      }
    },
    [type, onChange, values],
  )

  React.useEffect(() => {
    if (type === 'checkbox') {
      if (
        maxSelections &&
        values.length >= maxSelections &&
        maxReached === false
      ) {
        setMaxReached(true)
      } else if (
        maxSelections &&
        values.length < maxSelections &&
        maxReached === true
      ) {
        setMaxReached(false)
      }
    }
  }, [type, values.length, maxSelections, maxReached, setMaxReached])

  const context = React.useMemo(
    () => ({
      values,
      type,
      disabled,
      maxSelectionsReached: maxReached,
      setFieldValue,
    }),
    [values, disabled, type, maxReached, setFieldValue],
  )

  return (
    <GroupContext.Provider value={context}>
      <View
        style={[a.w_full]}
        role={groupRole}
        {...(groupRole === 'radiogroup'
          ? {
              'aria-label': label,
              accessibilityLabel: label,
              accessibilityRole: groupRole,
            }
          : {})}>
        {children}
      </View>
    </GroupContext.Provider>
  )
}

export function Item({
  children,
  name,
  value = false,
  disabled: itemDisabled = false,
  onChange,
  isInvalid,
  style,
  type = 'checkbox',
  label,
  ...rest
}: ItemProps) {
  const {
    values: selectedValues,
    type: groupType,
    disabled: groupDisabled,
    setFieldValue,
    maxSelectionsReached,
  } = React.useContext(GroupContext)
  const {
    state: hovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {
    state: pressed,
    onIn: onPressIn,
    onOut: onPressOut,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  const role = groupType === 'radio' ? 'radio' : type
  const selected = selectedValues.includes(name) || !!value
  const disabled =
    groupDisabled || itemDisabled || (!selected && maxSelectionsReached)

  const onPress = React.useCallback(() => {
    const next = !selected
    setFieldValue({name, value: next})
    onChange?.(next)
  }, [name, selected, onChange, setFieldValue])

  const state = React.useMemo(
    () => ({
      name,
      selected,
      disabled: disabled ?? false,
      isInvalid: isInvalid ?? false,
      hovered,
      pressed,
      focused,
    }),
    [name, selected, disabled, hovered, pressed, focused, isInvalid],
  )

  return (
    <ItemContext.Provider value={state}>
      <Pressable
        accessibilityHint={undefined} // optional
        hitSlop={HITSLOP_10}
        {...rest}
        disabled={disabled}
        aria-disabled={disabled ?? false}
        aria-checked={selected}
        aria-invalid={isInvalid}
        aria-label={label}
        role={role}
        accessibilityRole={role}
        accessibilityState={{
          disabled: disabled ?? false,
          selected: selected,
        }}
        accessibilityLabel={label}
        onPress={onPress}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[a.flex_row, a.align_center, a.gap_sm, flatten(style)]}>
        {typeof children === 'function' ? children(state) : children}
      </Pressable>
    </ItemContext.Provider>
  )
}

export function LabelText({
  children,
  style,
}: React.PropsWithChildren<TextStyleProp>) {
  const t = useTheme()
  const {disabled} = useItemContext()
  return (
    <Text
      style={[
        a.font_bold,
        a.leading_tight,
        {
          userSelect: 'none',
          color: disabled
            ? t.atoms.text_contrast_low.color
            : t.atoms.text_contrast_high.color,
        },
        native({
          paddingTop: 2,
        }),
        flatten(style),
      ]}>
      {children}
    </Text>
  )
}

// TODO(eric) refactor to memoize styles without knowledge of state
export function createSharedToggleStyles({
  theme: t,
  hovered,
  selected,
  disabled,
  isInvalid,
}: {
  theme: ReturnType<typeof useTheme>
  selected: boolean
  hovered: boolean
  focused: boolean
  disabled: boolean
  isInvalid: boolean
}) {
  const base: ViewStyle[] = []
  const baseHover: ViewStyle[] = []
  const indicator: ViewStyle[] = []

  if (selected) {
    base.push({
      backgroundColor: t.palette.primary_25,
      borderColor: t.palette.primary_500,
    })

    if (hovered) {
      baseHover.push({
        backgroundColor: t.palette.primary_100,
        borderColor: t.palette.primary_600,
      })
    }
  } else {
    if (hovered) {
      baseHover.push({
        backgroundColor: t.palette.contrast_50,
        borderColor: t.palette.contrast_500,
      })
    }
  }

  if (isInvalid) {
    base.push({
      backgroundColor: t.palette.negative_25,
      borderColor: t.palette.negative_300,
    })

    if (hovered) {
      baseHover.push({
        backgroundColor: t.palette.negative_25,
        borderColor: t.palette.negative_600,
      })
    }
  }

  if (disabled) {
    base.push({
      backgroundColor: t.palette.contrast_100,
      borderColor: t.palette.contrast_400,
    })
  }

  return {
    baseStyles: base,
    baseHoverStyles: disabled ? [] : baseHover,
    indicatorStyles: indicator,
  }
}

export function Checkbox() {
  const t = useTheme()
  const {selected, hovered, focused, disabled, isInvalid} = useItemContext()
  const {baseStyles, baseHoverStyles} = createSharedToggleStyles({
    theme: t,
    hovered,
    focused,
    selected,
    disabled,
    isInvalid,
  })
  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_xs,
        t.atoms.border_contrast_high,
        {
          borderWidth: 1,
          height: 24,
          width: 24,
        },
        baseStyles,
        hovered ? baseHoverStyles : {},
      ]}>
      {selected ? <Checkmark size="xs" fill={t.palette.primary_500} /> : null}
    </View>
  )
}

export function Switch() {
  const t = useTheme()
  const {selected, hovered, focused, disabled, isInvalid} = useItemContext()
  const {baseStyles, baseHoverStyles, indicatorStyles} =
    createSharedToggleStyles({
      theme: t,
      hovered,
      focused,
      selected,
      disabled,
      isInvalid,
    })
  return (
    <View
      style={[
        a.relative,
        a.rounded_full,
        t.atoms.bg,
        t.atoms.border_contrast_high,
        {
          borderWidth: 1,
          height: 24,
          width: 36,
          padding: 3,
        },
        baseStyles,
        hovered ? baseHoverStyles : {},
      ]}>
      <Animated.View
        layout={LinearTransition.duration(100)}
        style={[
          a.rounded_full,
          {
            height: 16,
            width: 16,
          },
          selected
            ? {
                backgroundColor: t.palette.primary_500,
                alignSelf: 'flex-end',
              }
            : {
                backgroundColor: t.palette.contrast_400,
                alignSelf: 'flex-start',
              },
          indicatorStyles,
        ]}
      />
    </View>
  )
}

export function Radio() {
  const t = useTheme()
  const {selected, hovered, focused, disabled, isInvalid} =
    React.useContext(ItemContext)
  const {baseStyles, baseHoverStyles, indicatorStyles} =
    createSharedToggleStyles({
      theme: t,
      hovered,
      focused,
      selected,
      disabled,
      isInvalid,
    })
  return (
    <View
      style={[
        a.justify_center,
        a.align_center,
        a.rounded_full,
        t.atoms.border_contrast_high,
        {
          borderWidth: 1,
          height: 24,
          width: 24,
        },
        baseStyles,
        hovered ? baseHoverStyles : {},
      ]}>
      {selected ? (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {height: 16, width: 16},
            selected
              ? {
                  backgroundColor: t.palette.primary_500,
                }
              : {},
            indicatorStyles,
          ]}
        />
      ) : null}
    </View>
  )
}

export const Platform = isNative ? Switch : Checkbox

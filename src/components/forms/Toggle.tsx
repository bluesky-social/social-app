import React from 'react'
import {Pressable, View, ViewStyle} from 'react-native'

import {HITSLOP_10} from 'lib/constants'
import {useTheme, atoms as a, web, native, flatten, ViewStyleProp} from '#/alf'
import {Text} from '#/components/Typography'
import {useInteractionState} from '#/components/hooks/useInteractionState'

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
        style={[
          a.flex_row,
          a.align_center,
          a.gap_sm,
          focused ? web({outline: 'none'}) : {},
          flatten(style),
        ]}>
        {typeof children === 'function' ? children(state) : children}
      </Pressable>
    </ItemContext.Provider>
  )
}

export function Label({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const {disabled} = useItemContext()
  return (
    <Text
      style={[
        a.font_bold,
        {
          userSelect: 'none',
          color: disabled ? t.palette.contrast_400 : t.palette.contrast_600,
        },
        native({
          paddingTop: 3,
        }),
      ]}>
      {children}
    </Text>
  )
}

// TODO(eric) refactor to memoize styles without knowledge of state
export function createSharedToggleStyles({
  theme: t,
  hovered,
  focused,
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
      backgroundColor:
        t.name === 'light' ? t.palette.primary_25 : t.palette.primary_900,
      borderColor: t.palette.primary_500,
    })

    if (hovered || focused) {
      baseHover.push({
        backgroundColor:
          t.name === 'light' ? t.palette.primary_100 : t.palette.primary_800,
        borderColor:
          t.name === 'light' ? t.palette.primary_600 : t.palette.primary_400,
      })
    }
  } else {
    if (hovered || focused) {
      baseHover.push({
        backgroundColor:
          t.name === 'light' ? t.palette.contrast_50 : t.palette.contrast_100,
        borderColor: t.palette.contrast_500,
      })
    }
  }

  if (isInvalid) {
    base.push({
      backgroundColor:
        t.name === 'light' ? t.palette.negative_25 : t.palette.negative_900,
      borderColor:
        t.name === 'light' ? t.palette.negative_300 : t.palette.negative_800,
    })

    if (hovered || focused) {
      baseHover.push({
        backgroundColor:
          t.name === 'light' ? t.palette.negative_25 : t.palette.negative_900,
        borderColor: t.palette.negative_500,
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
        a.border,
        a.rounded_xs,
        t.atoms.border_contrast,
        {
          height: 20,
          width: 20,
        },
        baseStyles,
        hovered || focused ? baseHoverStyles : {},
      ]}>
      {selected ? (
        <View
          style={[
            a.absolute,
            a.rounded_2xs,
            {height: 12, width: 12},
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
        a.border,
        a.rounded_full,
        t.atoms.bg,
        t.atoms.border_contrast,
        {
          height: 20,
          width: 30,
        },
        baseStyles,
        hovered || focused ? baseHoverStyles : {},
      ]}>
      <View
        style={[
          a.absolute,
          a.rounded_full,
          {
            height: 12,
            width: 12,
            top: 3,
            left: 3,
            backgroundColor: t.palette.contrast_400,
          },
          selected
            ? {
                backgroundColor: t.palette.primary_500,
                left: 13,
              }
            : {},
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
        a.border,
        a.rounded_full,
        t.atoms.border_contrast,
        {
          height: 20,
          width: 20,
        },
        baseStyles,
        hovered || focused ? baseHoverStyles : {},
      ]}>
      {selected ? (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {height: 12, width: 12},
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

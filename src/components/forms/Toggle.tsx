import React from 'react'
import {Pressable, PressableProps, View, ViewStyle} from 'react-native'

import {useTheme, atoms as a, web} from '#/alf'
import {Text} from '#/components/Typography'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {StyleProp} from 'react-native'
import {AccessibilityRole} from 'react-native'

type ItemState = {
  id: string
  name: string
  value: boolean
  disabled: boolean
  hasError: boolean
  hovered: boolean
  pressed: boolean
  focused: boolean
}

const ItemContext = React.createContext<ItemState>({
  id: '',
  name: '',
  value: false,
  disabled: false,
  hasError: false,
  hovered: false,
  pressed: false,
  focused: false,
})

const GroupContext = React.createContext<{
  values: string[]
  disabled: boolean
  role?: 'radio' | 'checkbox'
}>({
  values: [],
  disabled: false,
  role: 'checkbox',
})

type ItemProps = Omit<PressableProps, 'children' | 'style' | 'onPress'> & {
  name: string
  value?: boolean
  onChange?: ({name, value}: {name: string; value: boolean}) => void
  hasError?: boolean
  style?: (state: ItemState) => ViewStyle
  children: ((props: ItemState) => React.ReactNode) | React.ReactNode
}

function Item({
  children,
  name,
  value = false,
  disabled,
  onChange,
  hasError,
  style,
  role,
}: ItemProps) {
  const labelId = React.useId()
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

  const onPress = React.useCallback(() => {
    const next = !value
    onChange?.({name, value: next})
  }, [name, value, onChange])

  const state = React.useMemo(
    () => ({
      id: labelId,
      name,
      value,
      disabled: disabled ?? false,
      hasError: hasError ?? false,
      hovered,
      pressed,
      focused,
    }),
    [labelId, name, value, disabled, hovered, pressed, focused, hasError],
  )

  return (
    <ItemContext.Provider value={state}>
      <Pressable
        disabled={disabled}
        aria-disabled={disabled ?? false}
        aria-checked={value}
        aria-labelledby={labelId}
        aria-invalid={hasError}
        role={role}
        accessibilityRole={role as AccessibilityRole}
        accessibilityState={{
          disabled: disabled ?? false,
          selected: value,
        }}
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
          style?.(state),
        ]}>
        {typeof children === 'function' ? children(state) : children}
      </Pressable>
    </ItemContext.Provider>
  )
}

function Group({
  children,
  values: initialValues,
  onChange,
  disabled,
  role = 'checkbox',
  maxSelections,
  style,
}: React.PropsWithChildren<{
  values: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  role?: 'radio' | 'checkbox'
  maxSelections?: number
  style?: StyleProp<ViewStyle>
}>) {
  const _disabled = disabled ?? false
  const [values, setValues] = React.useState<string[]>(
    role === 'radio' ? initialValues.slice(0, 1) : initialValues,
  )
  const [maxReached, setMaxReached] = React.useState(false)

  const itemOnChange = React.useCallback<
    Exclude<ItemProps['onChange'], undefined>
  >(
    ({name, value}) => {
      if (role === 'checkbox') {
        setValues(s => {
          const state = s.filter(v => v !== name)
          return value ? state.concat(name) : state
        })
      } else {
        setValues([name])
      }
    },
    [role, setValues],
  )

  React.useEffect(() => {
    onChange(values)
  }, [values, onChange])

  React.useEffect(() => {
    if (role === 'checkbox') {
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
  }, [role, values.length, maxSelections, maxReached, setMaxReached])

  return (
    <GroupContext.Provider value={{values, disabled: _disabled, role}}>
      <View role={role === 'radio' ? 'radiogroup' : undefined} style={style}>
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return null

          const isSelected = values.includes(child.props.name)
          let isDisabled = _disabled || child.props.disabled

          if (maxReached && !isSelected) {
            isDisabled = true
          }

          return React.isValidElement(child) ? (
            <React.Fragment key={child.props.name}>
              {React.cloneElement(child, {
                // @ts-ignore TODO figure out children types
                disabled: isDisabled,
                role: role === 'radio' ? 'radio' : 'checkbox',
                value: isSelected,
                onChange: itemOnChange,
              })}
            </React.Fragment>
          ) : null
        })}
      </View>
    </GroupContext.Provider>
  )
}

function Label({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const {id, disabled} = React.useContext(ItemContext)
  return (
    <Text
      nativeID={id}
      style={[
        a.font_bold,
        {
          userSelect: 'none',
          color: disabled ? t.palette.contrast_400 : t.palette.contrast_600,
        },
      ]}>
      {children}
    </Text>
  )
}

function createSharedToggleStyles({
  theme: t,
  hovered,
  focused,
  value,
  disabled,
  hasError,
}: {
  theme: ReturnType<typeof useTheme>
  value: boolean
  hovered: boolean
  focused: boolean
  disabled: boolean
  hasError: boolean
}) {
  const base: ViewStyle[] = []
  const baseHover: ViewStyle[] = []
  const indicator: ViewStyle[] = []

  if (value) {
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
        backgroundColor: t.palette.contrast_50,
        borderColor: t.palette.contrast_500,
      })
    }
  }

  if (hasError) {
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
      backgroundColor: t.palette.contrast_200,
      borderColor: t.palette.contrast_300,
    })
  }

  return {
    baseStyles: base,
    baseHoverStyles: baseHover,
    indicatorStyles: indicator,
  }
}

function Checkbox() {
  const t = useTheme()
  const {value, hovered, focused, disabled, hasError} =
    React.useContext(ItemContext)
  const {baseStyles, baseHoverStyles, indicatorStyles} =
    createSharedToggleStyles({
      theme: t,
      hovered,
      focused,
      value,
      disabled,
      hasError,
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
          backgroundColor: value ? t.palette.primary_500 : undefined,
          borderColor: value ? t.palette.primary_500 : undefined,
        },
        baseStyles,
        hovered || focused ? baseHoverStyles : {},
      ]}>
      {value ? (
        <View
          style={[
            a.absolute,
            a.rounded_2xs,
            {height: 12, width: 12},
            value
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

function Switch() {
  const t = useTheme()
  const {value, hovered, focused, disabled, hasError} =
    React.useContext(ItemContext)
  const {baseStyles, baseHoverStyles, indicatorStyles} =
    createSharedToggleStyles({
      theme: t,
      hovered,
      focused,
      value,
      disabled,
      hasError,
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
          value
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

function Radio() {
  const t = useTheme()
  const {value, hovered, focused, disabled, hasError} =
    React.useContext(ItemContext)
  const {baseStyles, baseHoverStyles, indicatorStyles} =
    createSharedToggleStyles({
      theme: t,
      hovered,
      focused,
      value,
      disabled,
      hasError,
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
          backgroundColor: value ? t.palette.primary_500 : undefined,
          borderColor: value ? t.palette.primary_500 : undefined,
        },
        baseStyles,
        hovered || focused ? baseHoverStyles : {},
      ]}>
      {value ? (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {height: 12, width: 12},
            value
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

export default {
  Item,
  Checkbox,
  Label,
  Switch,
  Radio,
  Group,
}

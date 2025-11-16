import {createContext, useCallback, useContext, useMemo} from 'react'
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, {Easing, LinearTransition} from 'react-native-reanimated'

import {HITSLOP_10} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {isNative} from '#/platform/detection'
import {
  atoms as a,
  native,
  platform,
  type TextStyleProp,
  useTheme,
  type ViewStyleProp,
} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {CheckThick_Stroke2_Corner0_Rounded as Checkmark} from '#/components/icons/Check'
import {Text} from '#/components/Typography'

export * from './Panel'

export type ItemState = {
  name: string
  selected: boolean
  disabled: boolean
  isInvalid: boolean
  hovered: boolean
  pressed: boolean
  focused: boolean
}

const ItemContext = createContext<ItemState>({
  name: '',
  selected: false,
  disabled: false,
  isInvalid: false,
  hovered: false,
  pressed: false,
  focused: false,
})
ItemContext.displayName = 'ToggleItemContext'

const GroupContext = createContext<{
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
GroupContext.displayName = 'ToggleGroupContext'

export type GroupProps = React.PropsWithChildren<{
  type?: 'radio' | 'checkbox'
  values: string[]
  maxSelections?: number
  disabled?: boolean
  onChange: (value: string[]) => void
  label: string
  style?: StyleProp<ViewStyle>
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
  hitSlop?: PressableProps['hitSlop']
}

export function useItemContext() {
  return useContext(ItemContext)
}

export function Group({
  children,
  values: providedValues,
  onChange,
  disabled = false,
  type = 'checkbox',
  maxSelections,
  label,
  style,
}: GroupProps) {
  const groupRole = type === 'radio' ? 'radiogroup' : undefined
  const values = type === 'radio' ? providedValues.slice(0, 1) : providedValues

  const setFieldValue = useCallback<
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

  const maxReached = !!(
    type === 'checkbox' &&
    maxSelections &&
    values.length >= maxSelections
  )

  const context = useMemo(
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
        style={[a.w_full, style]}
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
  } = useContext(GroupContext)
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
  const playHaptic = useHaptics()

  const role = groupType === 'radio' ? 'radio' : type
  const selected = selectedValues.includes(name) || !!value
  const disabled =
    groupDisabled || itemDisabled || (!selected && maxSelectionsReached)

  const onPress = useCallback(() => {
    playHaptic('Light')
    const next = !selected
    setFieldValue({name, value: next})
    onChange?.(next)
  }, [playHaptic, name, selected, onChange, setFieldValue])

  const state = useMemo(
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
        style={[a.flex_row, a.align_center, a.gap_sm, style]}>
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
        a.font_semi_bold,
        a.leading_tight,
        a.user_select_none,
        {
          color: disabled
            ? t.atoms.text_contrast_low.color
            : t.atoms.text_contrast_high.color,
        },
        native({
          paddingTop: 2,
        }),
        style,
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
      backgroundColor: t.palette.primary_500,
      borderColor: t.palette.primary_500,
    })

    if (hovered) {
      baseHover.push({
        backgroundColor: t.palette.primary_400,
        borderColor: t.palette.primary_400,
      })
    }
  } else {
    base.push({
      backgroundColor: t.palette.contrast_25,
      borderColor: t.palette.contrast_100,
    })

    if (hovered) {
      baseHover.push({
        backgroundColor: t.palette.contrast_50,
        borderColor: t.palette.contrast_200,
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

    if (selected) {
      base.push({
        backgroundColor: t.palette.negative_500,
        borderColor: t.palette.negative_500,
      })

      if (hovered) {
        baseHover.push({
          backgroundColor: t.palette.negative_400,
          borderColor: t.palette.negative_400,
        })
      }
    }
  }

  if (disabled) {
    base.push({
      backgroundColor: t.palette.contrast_100,
      borderColor: t.palette.contrast_400,
    })

    if (selected) {
      base.push({
        backgroundColor: t.palette.primary_100,
        borderColor: t.palette.contrast_400,
      })
    }
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
        t.atoms.border_contrast_high,
        a.transition_color,
        {
          borderWidth: 1,
          height: 24,
          width: 24,
          borderRadius: 6,
        },
        baseStyles,
        hovered ? baseHoverStyles : {},
      ]}>
      {selected && <Checkmark width={14} fill={t.palette.white} />}
    </View>
  )
}

export function Switch() {
  const t = useTheme()
  const {selected, hovered, disabled, isInvalid} = useItemContext()
  const {baseStyles, baseHoverStyles, indicatorStyles} = useMemo(() => {
    const base: ViewStyle[] = []
    const baseHover: ViewStyle[] = []
    const indicator: ViewStyle[] = []

    if (selected) {
      base.push({
        backgroundColor: t.palette.primary_500,
      })

      if (hovered) {
        baseHover.push({
          backgroundColor: t.palette.primary_400,
        })
      }
    } else {
      base.push({
        backgroundColor: t.palette.contrast_200,
      })

      if (hovered) {
        baseHover.push({
          backgroundColor: t.palette.contrast_100,
        })
      }
    }

    if (isInvalid) {
      base.push({
        backgroundColor: t.palette.negative_200,
      })

      if (hovered) {
        baseHover.push({
          backgroundColor: t.palette.negative_100,
        })
      }

      if (selected) {
        base.push({
          backgroundColor: t.palette.negative_500,
        })

        if (hovered) {
          baseHover.push({
            backgroundColor: t.palette.negative_400,
          })
        }
      }
    }

    if (disabled) {
      base.push({
        backgroundColor: t.palette.contrast_50,
      })

      if (selected) {
        base.push({
          backgroundColor: t.palette.primary_100,
        })
      }
    }

    return {
      baseStyles: base,
      baseHoverStyles: disabled ? [] : baseHover,
      indicatorStyles: indicator,
    }
  }, [t, hovered, disabled, selected, isInvalid])

  return (
    <View
      style={[
        a.relative,
        a.rounded_full,
        t.atoms.bg,
        {
          height: 28,
          width: 48,
          padding: 3,
        },
        a.transition_color,
        baseStyles,
        hovered ? baseHoverStyles : {},
      ]}>
      <Animated.View
        layout={LinearTransition.duration(
          platform({
            web: 100,
            default: 200,
          }),
        ).easing(Easing.inOut(Easing.cubic))}
        style={[
          a.rounded_full,
          {
            backgroundColor: t.palette.white,
            height: 22,
            width: 22,
          },
          selected ? {alignSelf: 'flex-end'} : {alignSelf: 'flex-start'},
          indicatorStyles,
        ]}
      />
    </View>
  )
}

export function Radio() {
  const t = useTheme()
  const {selected, hovered, focused, disabled, isInvalid} =
    useContext(ItemContext)
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
        a.transition_color,
        {
          borderWidth: 1,
          height: 25,
          width: 25,
          margin: -1,
        },
        baseStyles,
        hovered ? baseHoverStyles : {},
      ]}>
      {selected && (
        <View
          style={[
            a.absolute,
            a.rounded_full,
            {height: 12, width: 12},
            {backgroundColor: t.palette.white},
            indicatorStyles,
          ]}
        />
      )}
    </View>
  )
}

export const Platform = isNative ? Switch : Checkbox

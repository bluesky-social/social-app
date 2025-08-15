import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import Animated, {Easing, LinearTransition} from 'react-native-reanimated'

import {atoms as a, native, platform, useTheme} from '#/alf'
import {
  Button,
  type ButtonProps,
  ButtonText,
  type ButtonTextProps,
} from '../Button'

const InternalContext = createContext<{
  type: 'tabs' | 'radio'
  selectedValue: string
  selectedPosition: {width: number; x: number} | null
  onSelectValue: (
    value: string,
    position: {width: number; x: number} | null,
  ) => void
} | null>(null)

/**
 * Segmented control component.
 *
 * @example
 * ```tsx
 * <SegmentedControl.Root value={value} onChange={setValue}>
 *   <SegmentedControl.Item value="one">
 *     <SegmentedControl.ItemText value="one">
 *       One
 *     </SegmentedControl.ItemText>
 *   </SegmentedControl.Item>
 *   <SegmentedControl.Item value="two">
 *     <SegmentedControl.ItemText value="two">
 *       Two
 *     </SegmentedControl.ItemText>
 *   </SegmentedControl.Item>
 * </SegmentedControl.Root>
 * ```
 */
export function Root<T extends string>({
  label,
  type,
  value,
  onChange,
  children,
  style,
  accessibilityHint,
}: {
  label: string
  type: 'tabs' | 'radio'
  value: T
  onChange: (value: T) => void
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  accessibilityHint?: string
}) {
  const t = useTheme()
  const [selectedPosition, setSelectedPosition] = useState<{
    width: number
    x: number
  } | null>(null)

  const contextValue = useMemo(() => {
    return {
      type,
      selectedValue: value,
      selectedPosition,
      onSelectValue: (
        val: string,
        position: {width: number; x: number} | null,
      ) => {
        onChange(val as T)
        if (position) setSelectedPosition(position)
      },
    }
  }, [value, selectedPosition, setSelectedPosition, onChange, type])

  return (
    <View
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? ''}
      style={[
        a.w_full,
        a.flex_1,
        a.relative,
        a.flex_row,
        t.atoms.bg_contrast_25,
        {borderRadius: 14},
        a.curve_continuous,
        a.p_xs,
        style,
      ]}
      role={type === 'tabs' ? 'tablist' : 'radiogroup'}>
      {selectedPosition !== null && (
        <Slider x={selectedPosition.x} width={selectedPosition.width} />
      )}
      <InternalContext.Provider value={contextValue}>
        {children}
      </InternalContext.Provider>
    </View>
  )
}

const InternalItemContext = createContext<{
  active: boolean
  pressed: boolean
  hovered: boolean
  focused: boolean
} | null>(null)

export function Item({
  value,
  style,
  children,
  onPress: onPressProp,
  ...props
}: {value: string; children: React.ReactNode} & Omit<ButtonProps, 'children'>) {
  const [position, setPosition] = useState<{x: number; width: number} | null>(
    null,
  )

  const ctx = useContext(InternalContext)
  if (!ctx)
    throw new Error(
      'SegmentedControl.Item must be used within a SegmentedControl.Root',
    )

  const active = ctx.selectedValue === value

  const onPress = useCallback(
    (evt: any) => {
      ctx.onSelectValue(value, position)
      onPressProp?.(evt)
    },
    [ctx, value, position, onPressProp],
  )

  return (
    <View
      style={[a.flex_1, a.flex_row]}
      onLayout={evt => {
        const measuredPosition = {
          x: evt.nativeEvent.layout.x,
          width: evt.nativeEvent.layout.width,
        }
        if (!ctx.selectedPosition && active) {
          ctx.onSelectValue(value, measuredPosition)
        }
        setPosition(measuredPosition)
      }}>
      <Button
        {...props}
        onPress={onPress}
        role={ctx.type === 'tabs' ? 'tab' : 'radio'}
        accessibilityState={{selected: active}}
        style={[
          a.flex_1,
          a.bg_transparent,
          {borderRadius: 10},
          a.curve_continuous,
          a.px_sm,
          style,
        ]}>
        {({pressed, hovered, focused}) => (
          <InternalItemContext.Provider
            value={{active, pressed, hovered, focused}}>
            {children}
          </InternalItemContext.Provider>
        )}
      </Button>
    </View>
  )
}

export function ItemText({style, ...props}: ButtonTextProps) {
  const t = useTheme()
  const ctx = useContext(InternalItemContext)
  if (!ctx)
    throw new Error(
      'SegmentedControl.ItemText must be used within a SegmentedControl.Item',
    )
  return (
    <ButtonText
      {...props}
      style={[
        a.text_center,
        a.text_md,
        a.py_md,
        a.px_xs,
        ctx.active
          ? t.atoms.text
          : ctx.focused || ctx.hovered || ctx.pressed
            ? t.atoms.text_contrast_medium
            : t.atoms.text_contrast_low,
        style,
      ]}
    />
  )
}

function Slider({x, width}: {x: number; width: number}) {
  const t = useTheme()

  return (
    <Animated.View
      layout={native(LinearTransition.easing(Easing.out(Easing.exp)))}
      style={[
        a.absolute,
        a.curve_continuous,
        t.atoms.bg,
        {top: 4, bottom: 4, left: 0, width, borderRadius: 10},
        platform({
          native: [{left: x}],
          web: [{transform: [{translateX: x}]}, a.transition_transform],
        }),
      ]}
    />
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import Animated, {Easing, LinearTransition} from 'react-native-reanimated'

import {useHaptics} from '#/lib/haptics'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {atoms as a, native, platform, useTheme} from '#/alf'
import {
  Button,
  type ButtonProps,
  ButtonText,
  type ButtonTextProps,
} from '../Button'

const InternalContext = createContext<{
  type: 'tabs' | 'radio'
  size: 'small' | 'large'
  selectedValue: string
  selectedPosition: {width: number; x: number} | null
  onSelectValue: (
    value: string,
    position: {width: number; x: number} | null,
  ) => void
  updatePosition: (position: {width: number; x: number}) => void
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
  type = 'radio',
  size = 'large',
  value,
  onChange,
  children,
  style,
  accessibilityHint,
}: {
  label: string
  type: 'tabs' | 'radio'
  size?: 'small' | 'large'
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
      size,
      selectedValue: value,
      selectedPosition,
      onSelectValue: (
        val: string,
        position: {width: number; x: number} | null,
      ) => {
        onChange(val as T)
        if (position) setSelectedPosition(position)
      },
      updatePosition: (position: {width: number; x: number}) => {
        setSelectedPosition(currPos => {
          if (
            currPos &&
            currPos.width === position.width &&
            currPos.x === position.x
          ) {
            return currPos
          }
          return position
        })
      },
    }
  }, [value, selectedPosition, setSelectedPosition, onChange, type, size])

  return (
    <View
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? ''}
      style={[
        a.w_full,
        a.flex_1,
        a.relative,
        a.flex_row,
        t.atoms.bg_contrast_50,
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
  const playHaptic = useHaptics()
  const [position, setPosition] = useState<{x: number; width: number} | null>(
    null,
  )

  const ctx = useContext(InternalContext)
  if (!ctx)
    throw new Error(
      'SegmentedControl.Item must be used within a SegmentedControl.Root',
    )

  const active = ctx.selectedValue === value

  // update position if change was external, and not due to onPress
  const needsUpdate =
    active &&
    position &&
    (ctx.selectedPosition?.x !== position.x ||
      ctx.selectedPosition?.width !== position.width)

  // can't wait for `useEffectEvent`
  const update = useNonReactiveCallback(() => {
    if (position) ctx.updatePosition(position)
  })

  useLayoutEffect(() => {
    if (needsUpdate) {
      update()
    }
  }, [needsUpdate, update])

  const onPress = useCallback(
    (evt: any) => {
      playHaptic('Light')
      ctx.onSelectValue(value, position)
      onPressProp?.(evt)
    },
    [ctx, value, position, onPressProp, playHaptic],
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
          a.px_sm,
          a.py_xs,
          {minHeight: ctx.size === 'large' ? 40 : 32},
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
        a.font_medium,
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
        {
          top: 4,
          bottom: 4,
          left: 0,
          width,
          borderRadius: 10,
        },
        // TODO: new arch supports boxShadow on native
        // in the meantime this is an attempt to get close
        platform({
          web: {
            boxShadow: '0px 2px 4px 0px #0000000D',
          },
          ios: {
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0x0d / 0xff,
            shadowRadius: 4,
          },
          android: {elevation: 0.25},
        }),
        platform({
          native: [{left: x}],
          web: [{transform: [{translateX: x}]}, a.transition_transform],
        }),
      ]}
    />
  )
}

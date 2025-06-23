import {createContext, useCallback, useContext} from 'react'
import {type GestureResponderEvent, Keyboard, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {HITSLOP_30} from '#/lib/constants'
import {type NavigationProp} from '#/lib/routes/types'
import {isIOS} from '#/platform/detection'
import {useSetDrawerOpen} from '#/state/shell'
import {
  atoms as a,
  platform,
  type TextStyleProp,
  useBreakpoints,
  useGutters,
  useLayoutBreakpoints,
  useTheme,
  web,
} from '#/alf'
import {Button, ButtonIcon, type ButtonProps} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {Menu_Stroke2_Corner0_Rounded as Menu} from '#/components/icons/Menu'
import {
  BUTTON_VISUAL_ALIGNMENT_OFFSET,
  CENTER_COLUMN_OFFSET,
  HEADER_SLOT_SIZE,
  SCROLLBAR_OFFSET,
} from '#/components/Layout/const'
import {ScrollbarOffsetContext} from '#/components/Layout/context'
import {Text} from '#/components/Typography'

export function Outer({
  children,
  noBottomBorder,
  headerRef,
  sticky = true,
}: {
  children: React.ReactNode
  noBottomBorder?: boolean
  headerRef?: React.MutableRefObject<View | null>
  sticky?: boolean
}) {
  const t = useTheme()
  const gutters = useGutters([0, 'base'])
  const {gtMobile} = useBreakpoints()
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext)
  const {centerColumnOffset} = useLayoutBreakpoints()

  return (
    <View
      ref={headerRef}
      style={[
        a.w_full,
        !noBottomBorder && a.border_b,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        sticky && web([a.sticky, {top: 0}, a.z_10, t.atoms.bg]),
        gutters,
        platform({
          native: [a.pb_xs, {minHeight: 48}],
          web: [a.py_xs, {minHeight: 52}],
        }),
        t.atoms.border_contrast_low,
        gtMobile && [a.mx_auto, {maxWidth: 600}],
        !isWithinOffsetView && {
          transform: [
            {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0},
            {translateX: web(SCROLLBAR_OFFSET) ?? 0},
          ],
        },
      ]}>
      {children}
    </View>
  )
}

const AlignmentContext = createContext<'platform' | 'left'>('platform')

export function Content({
  children,
  align = 'platform',
}: {
  children?: React.ReactNode
  align?: 'platform' | 'left'
}) {
  return (
    <View
      style={[
        a.flex_1,
        a.justify_center,
        isIOS && align === 'platform' && a.align_center,
        {minHeight: HEADER_SLOT_SIZE},
      ]}>
      <AlignmentContext.Provider value={align}>
        {children}
      </AlignmentContext.Provider>
    </View>
  )
}

export function Slot({children}: {children?: React.ReactNode}) {
  return <View style={[a.z_50, {width: HEADER_SLOT_SIZE}]}>{children}</View>
}

export function BackButton({onPress, style, ...props}: Partial<ButtonProps>) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = useCallback(
    (evt: GestureResponderEvent) => {
      onPress?.(evt)
      if (evt.defaultPrevented) return
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Home')
      }
    },
    [onPress, navigation],
  )

  return (
    <Slot>
      <Button
        label={_(msg`Go back`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="square"
        onPress={onPressBack}
        hitSlop={HITSLOP_30}
        style={[
          {marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET},
          a.bg_transparent,
          style,
        ]}
        {...props}>
        <ButtonIcon icon={ArrowLeft} size="lg" />
      </Button>
    </Slot>
  )
}

export function MenuButton() {
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const {gtMobile} = useBreakpoints()

  const onPress = useCallback(() => {
    Keyboard.dismiss()
    setDrawerOpen(true)
  }, [setDrawerOpen])

  return gtMobile ? null : (
    <Slot>
      <Button
        label={_(msg`Open drawer menu`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="square"
        onPress={onPress}
        hitSlop={HITSLOP_30}
        style={[{marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET}]}>
        <ButtonIcon icon={Menu} size="lg" />
      </Button>
    </Slot>
  )
}

export function TitleText({
  children,
  style,
}: {children: React.ReactNode} & TextStyleProp) {
  const {gtMobile} = useBreakpoints()
  const align = useContext(AlignmentContext)
  return (
    <Text
      style={[
        a.text_lg,
        a.font_heavy,
        a.leading_tight,
        isIOS && align === 'platform' && a.text_center,
        gtMobile && a.text_xl,
        style,
      ]}
      numberOfLines={2}
      emoji>
      {children}
    </Text>
  )
}

export function SubtitleText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const align = useContext(AlignmentContext)
  return (
    <Text
      style={[
        a.text_sm,
        a.leading_snug,
        isIOS && align === 'platform' && a.text_center,
        t.atoms.text_contrast_medium,
      ]}
      numberOfLines={2}>
      {children}
    </Text>
  )
}

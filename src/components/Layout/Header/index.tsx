import {createContext, useCallback, useContext} from 'react'
import {GestureResponderEvent, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {HITSLOP_30} from '#/lib/constants'
import {NavigationProp} from '#/lib/routes/types'
import {isIOS} from '#/platform/detection'
import {useSetDrawerOpen} from '#/state/shell'
import {
  atoms as a,
  platform,
  TextStyleProp,
  useBreakpoints,
  useGutters,
  useTheme,
} from '#/alf'
import {Button, ButtonIcon, ButtonProps} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {Menu_Stroke2_Corner0_Rounded as Menu} from '#/components/icons/Menu'
import {
  BUTTON_VISUAL_ALIGNMENT_OFFSET,
  HEADER_SLOT_SIZE,
} from '#/components/Layout/const'
import {ScrollbarOffsetContext} from '#/components/Layout/context'
import {Text} from '#/components/Typography'

export function Outer({
  children,
  noBottomBorder,
}: {
  children: React.ReactNode
  noBottomBorder?: boolean
}) {
  const t = useTheme()
  const gutters = useGutters([0, 'base'])
  const {gtMobile} = useBreakpoints()
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext)

  return (
    <View
      style={[
        a.w_full,
        !noBottomBorder && a.border_b,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        gutters,
        platform({
          native: [a.pb_sm, a.pt_xs],
          web: [a.py_sm],
        }),
        t.atoms.border_contrast_low,
        gtMobile && [a.mx_auto, {maxWidth: 600}],
        !isWithinOffsetView && a.scrollbar_offset,
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
  return (
    <View
      style={[
        a.z_50,
        {
          width: HEADER_SLOT_SIZE,
        },
      ]}>
      {children}
    </View>
  )
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
        style={[{marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET}, style]}
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
      numberOfLines={2}>
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

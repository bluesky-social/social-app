import React, {useContext} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isIOS} from '#/platform/detection'
import {useSetDrawerOpen} from '#/state/shell'
import {
  atoms as a,
  TextStyleProp,
  useBreakpoints,
  useGutterStyles,
  useTheme,
  web,
} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {Menu_Stroke2_Corner0_Rounded as Menu} from '#/components/icons/Menu'
import {Text} from '#/components/Typography'

const BUTTON_VISUAL_ALIGNMENT_OFFSET = 3
const BUTTON_SIZE = 34 // small button

export function Outer({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const gutter = useGutterStyles()
  const {gtMobile} = useBreakpoints()

  return (
    <View
      style={[
        a.w_full,
        a.border_b,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        gutter,
        a.py_sm,
        t.atoms.border_contrast_low,
        gtMobile && [a.mx_auto, {maxWidth: 600}],
        web({
          transform: [
            {
              translateX:
                'calc(-1 * var(--removed-body-scroll-bar-size, 0px) / 2)',
            },
          ],
        }),
      ]}>
      {children}
    </View>
  )
}

const AlignmentContext = React.createContext<'platform' | 'left'>('platform')

export function Content({
  children,
  align = 'platform',
}: {
  children: React.ReactNode
  align?: 'platform' | 'left'
}) {
  return (
    <View
      style={[
        a.flex_1,
        a.justify_center,
        isIOS && align === 'platform' && a.align_center,
        {minHeight: BUTTON_SIZE},
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
          width: BUTTON_SIZE,
        },
      ]}>
      {children}
    </View>
  )
}

export function BackButton() {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  return (
    <Slot>
      <Button
        label={_(msg`Go back`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="round"
        onPress={onPressBack}
        style={[{marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET}]}>
        <ButtonIcon icon={ArrowLeft} size="lg" />
      </Button>
    </Slot>
  )
}

export function MenuButton() {
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const {gtMobile} = useBreakpoints()

  const onPress = React.useCallback(() => {
    setDrawerOpen(true)
  }, [setDrawerOpen])

  return gtMobile ? null : (
    <Slot>
      <Button
        label={_(msg`Open drawer menu`)}
        size="small"
        variant="ghost"
        color="secondary"
        shape="round"
        onPress={onPress}
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

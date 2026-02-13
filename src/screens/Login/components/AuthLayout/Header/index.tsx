import {useContext} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_30} from '#/lib/constants'
import {Logomark} from '#/view/icons/Logomark'
import {atoms as a, platform, useGutters, useTheme} from '#/alf'
import {Button, ButtonIcon, type ButtonProps} from '#/components/Button'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {
  BUTTON_VISUAL_ALIGNMENT_OFFSET,
  Header,
  HEADER_SLOT_SIZE,
} from '#/components/Layout'
import {IS_WEB} from '#/env'
import {AuthLayoutNavigationContext} from '../context'

/**
 * This is a simplified version of `Layout.Header` for the auth screens.
 */

export const Slot = Header.Slot

export function Outer({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const gutters = useGutters([0, 'wide'])

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        gutters,
        platform({
          native: [a.pb_xs, {minHeight: 48}],
          web: [a.py_xs, {minHeight: 52}],
        }),
        t.atoms.border_contrast_low,
      ]}>
      {children}
    </View>
  )
}

export function Content({children}: {children?: React.ReactNode}) {
  return (
    <View style={[a.flex_1, a.justify_center, {minHeight: HEADER_SLOT_SIZE}]}>
      {IS_WEB ? children : <Logo />}
    </View>
  )
}

export function Logo() {
  const t = useTheme()

  return <Logomark fill={t.palette.primary_500} style={[a.mx_auto]} />
}

export function BackButton({onPress, style, ...props}: Partial<ButtonProps>) {
  const {_} = useLingui()
  const navigation = useContext(AuthLayoutNavigationContext)

  const onPressBack = (evt: GestureResponderEvent) => {
    onPress?.(evt)
    if (evt.defaultPrevented) return
    navigation?.goBack()
  }

  return (
    <Slot>
      <Button
        label={_(msg`Go back`)}
        onPress={onPressBack}
        size="small"
        variant="ghost"
        color="secondary"
        shape="round"
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

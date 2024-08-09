import React from 'react'
import {
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native'
import {ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {HeaderBackButton} from '@react-navigation/elements'

import {isWeb} from '#/platform/detection'
import {atoms as a, ios, useBreakpoints, useTheme} from '#/alf'
import {Menu_Stroke2_Corner0_Rounded as MenuIcon} from './icons/Menu'

const BACK_HITSLOP = {left: 20, top: 20, right: 50, bottom: 20}

export function BackButton({
  onPressBack,
  onPressMenu,
  canGoBack = true,
  style,
}: {
  onPressBack: () => void
  onPressMenu?: () => void
  canGoBack?: boolean
  style?: {
    web?: StyleProp<ViewStyle>
    native?: TouchableOpacityProps['style']
  }
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const showMenu = !!onPressMenu

  if (isWeb || !canGoBack) {
    return (
      <TouchableOpacity
        testID="backButton"
        onPress={canGoBack ? onPressBack : onPressMenu}
        hitSlop={BACK_HITSLOP}
        style={[
          {height: 30, width: 30},
          a.justify_center,
          !canGoBack && a.px_xs,
          style?.web,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          canGoBack ? _(msg`Back`) : showMenu ? _(msg`Menu`) : ''
        }
        accessibilityHint={
          canGoBack || !showMenu
            ? ''
            : _(msg`Access navigation links and settings`)
        }>
        {canGoBack ? (
          <FontAwesomeIcon size={20} icon="angle-left" style={t.atoms.text} />
        ) : !gtMobile && showMenu ? (
          <MenuIcon size="lg" style={t.atoms.text_contrast_medium} />
        ) : null}
      </TouchableOpacity>
    )
  }

  return (
    <View
      testID="backButton"
      style={[
        {width: 30, height: 30},
        a.justify_center,
        a.align_center,
        style?.native,
      ]}>
      <HeaderBackButton
        onPress={onPressBack}
        labelVisible={false}
        tintColor={t.atoms.text.color}
        style={ios({transform: [{scale: 0.8}]})}
      />
    </View>
  )
}

export function RightSpacer({wide}: {wide?: boolean}) {
  return <View style={[{width: 30, height: 30}, wide && a.px_xs]} />
}

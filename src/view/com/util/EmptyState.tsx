import React from 'react'
import {
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {atoms as a, useTheme} from '#/alf'
import {Button, type ButtonProps, ButtonText} from '#/components/Button'
import {EditBig_Stroke1_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'
import {Text} from '#/components/Typography'

export type EmptyStateButtonProps = Omit<ButtonProps, 'children' | 'label'> & {
  label: string
  text: string
}

export function EmptyState({
  testID,
  icon,
  message,
  style,
  textStyle,
  button,
}: {
  testID?: string
  icon: 'growth' | React.ReactElement
  message: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  button?: EmptyStateButtonProps
}) {
  const pal = usePalette('default')
  const {isTabletOrDesktop} = useWebMediaQueries()
  const iconSize = isTabletOrDesktop ? 64 : 48
  const t = useTheme()

  const placeholderIcon = (
<<<<<<< HEAD
    <EditIcon size="2xl" fill={t.atoms.text_contrast_low.color} />
=======
    <EditIcon size="3xl" fill={t.atoms.text_contrast_low.color} />
>>>>>>> aee67f715 (add empty state icon)
  )

  const renderIcon = () => {
    if (typeof icon === 'object' && React.isValidElement(icon)) {
      return icon
    }

    if (icon === 'growth') {
      return <Growth width={iconSize} fill={pal.colors.emptyStateIcon} />
    }

    return icon || placeholderIcon
  }

  return (
    <View testID={testID} style={style}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.justify_center,
          a.self_center,
          a.rounded_full,
          a.mt_5xl,
          {height: 80, width: 80},
          React.isValidElement(icon)
            ? a.bg_transparent
            : [
                isTabletOrDesktop && {width: 100, height: 100, marginTop: 50},
                pal.viewLight,
              ],
        ]}>
        {renderIcon()}
      </View>
      <Text
        style={[
          {color: pal.colors.textLight, maxWidth: '40%'},
          a.font_medium,
          a.text_md,
          a.leading_snug,
          a.text_center,
          a.self_center,
          textStyle,
        ]}>
        <Trans>{message}</Trans>
      </Text>
      {button && (
        <View style={[a.flex_shrink, a.mt_xl, a.self_center]}>
          <Button {...button}>
            <ButtonText>{button.text}</ButtonText>
          </Button>
        </View>
      )}
    </View>
  )
}

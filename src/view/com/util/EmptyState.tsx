import React from 'react'
import {type StyleProp, type TextStyle, type ViewStyle} from 'react-native'
import {View} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, type ButtonProps, ButtonText} from '#/components/Button'
import {EditBig_Stroke1_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Text} from '#/components/Typography'

export type EmptyStateButtonProps = Omit<ButtonProps, 'children' | 'label'> & {
  label: string
  text: string
}

export function EmptyState({
  testID,
  icon,
  iconSize = '3xl',
  message,
  style,
  textStyle,
  button,
}: {
  testID?: string
  icon?: React.ComponentType<any> | React.ReactElement
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  message: string
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  button?: EmptyStateButtonProps
}) {
  const pal = usePalette('default')
  const {isTabletOrDesktop} = useWebMediaQueries()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const placeholderIcon = (
    <EditIcon size="2xl" fill={t.atoms.text_contrast_low.color} />
  )

  const renderIcon = () => {
    if (!icon) {
      return placeholderIcon
    }

    if (typeof icon === 'object' && React.isValidElement(icon)) {
      return icon
    }

    if (typeof icon === 'function') {
      const IconComponent = icon
      return (
        <IconComponent
          size={iconSize}
          style={{color: t.atoms.text_contrast_low.color}}
        />
      )
    }

    return placeholderIcon
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
            : [isTabletOrDesktop && {width: 100, height: 100, marginTop: 50}],
        ]}>
        {renderIcon()}
      </View>
      <Text
        style={[
          {color: pal.colors.textLight, maxWidth: gtMobile ? '40%' : '60%'},
          a.font_medium,
          a.text_md,
          a.leading_snug,
          a.text_center,
          a.self_center,
          textStyle,
        ]}>
        {message}
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

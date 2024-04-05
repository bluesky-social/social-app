import React from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function FormContainer({
  testID,
  titleText,
  children,
  style,
}: {
  testID?: string
  titleText?: React.ReactNode
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  return (
    <View
      testID={testID}
      style={[a.gap_md, a.flex_1, !gtMobile && [a.px_lg, a.py_md], style]}>
      {titleText && !gtMobile && (
        <Text style={[a.text_xl, a.font_bold, t.atoms.text_contrast_high]}>
          {titleText}
        </Text>
      )}
      {children}
    </View>
  )
}

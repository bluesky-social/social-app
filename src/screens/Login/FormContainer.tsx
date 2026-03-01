import {type StyleProp, View, type ViewStyle} from 'react-native'
import type React from 'react'

import {atoms as a, useBreakpoints, useGutters} from '#/alf'
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
  const gutter = useGutters([0, 'wide'])

  return (
    <View
      testID={testID}
      style={[a.gap_md, a.flex_1, !gtMobile && gutter, style]}>
      {titleText && !gtMobile && (
        <Text style={[a.text_3xl, a.font_bold]}>{titleText}</Text>
      )}
      {children}
    </View>
  )
}

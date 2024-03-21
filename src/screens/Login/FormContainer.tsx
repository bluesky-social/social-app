import React from 'react'
import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'

import {isWeb} from '#/platform/detection'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function FormContainer({
  testID,
  title,
  children,
  style,
  contentContainerStyle,
}: {
  testID?: string
  title?: React.ReactNode
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}) {
  const {gtMobile} = useBreakpoints()
  const t = useTheme()
  return (
    <ScrollView
      testID={testID}
      style={[styles.maxHeight, contentContainerStyle]}
      keyboardShouldPersistTaps="handled">
      <View
        style={[a.gap_md, a.flex_1, !gtMobile && [a.px_lg, a.pt_md], style]}>
        {title && !gtMobile && (
          <Text style={[a.text_xl, a.font_bold, t.atoms.text_contrast_high]}>
            {title}
          </Text>
        )}
        {children}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  maxHeight: {
    // @ts-ignore web only -prf
    maxHeight: isWeb ? '100vh' : undefined,
    height: !isWeb ? '100%' : undefined,
  },
})

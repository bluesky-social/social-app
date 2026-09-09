import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function ActivityV2PreviewRow({
  hideTopBorder,
  preview,
  testID,
}: {
  hideTopBorder: boolean
  preview: string
  testID?: string
}) {
  const t = useTheme()

  return (
    <View
      style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}
      testID={testID}>
      <View style={[a.px_xl, a.py_lg]}>
        <Text
          numberOfLines={1}
          style={[a.text_sm, a.leading_snug, t.atoms.text]}>
          {preview}
        </Text>
      </View>
    </View>
  )
}

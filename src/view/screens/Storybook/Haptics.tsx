import {View} from 'react-native'

import {
  ANDROID_HAPTICS,
  IOS_HAPTICS,
  useHapticFeedback,
} from '#/lib/haptic-feedback'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function Haptics() {
  const t = useTheme()
  const haptics = useHapticFeedback()

  return (
    <View style={[a.gap_md]}>
      <Text style={[a.font_bold, a.text_5xl]}>Haptics</Text>

      <Text style={[a.font_bold, a.text_2xl]}>Semantic</Text>
      <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
        <Button
          label="Success haptic"
          size="small"
          color="primary"
          onPress={() => haptics.success()}>
          <ButtonText>success</ButtonText>
        </Button>
        <Button
          label="Error haptic"
          size="small"
          color="negative"
          onPress={() => haptics.error()}>
          <ButtonText>error</ButtonText>
        </Button>
      </View>

      <Text style={[a.font_bold, a.text_2xl]}>iOS</Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        UIImpactFeedbackGenerator.FeedbackStyle
      </Text>
      <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
        {Object.entries(IOS_HAPTICS).map(([name, value]) => (
          <Button
            key={name}
            label={`${name} haptic`}
            size="small"
            color="secondary"
            onPress={() => haptics.platform({ios: value})}>
            <ButtonText>{name}</ButtonText>
          </Button>
        ))}
      </View>

      <Text style={[a.font_bold, a.text_2xl]}>Android</Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        performHapticFeedback
      </Text>
      <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
        {Object.entries(ANDROID_HAPTICS).map(([name, value]) => (
          <Button
            key={name}
            label={`${name} haptic`}
            size="small"
            color="secondary"
            onPress={() => haptics.platform({android: value})}>
            <ButtonText>{name}</ButtonText>
          </Button>
        ))}
      </View>
    </View>
  )
}

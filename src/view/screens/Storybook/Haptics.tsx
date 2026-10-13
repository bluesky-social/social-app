import {View} from 'react-native'
import {AndroidHaptics} from 'expo-haptics'

import {
  type AndroidHaptic,
  HAPTIC_INTENTS,
  type IOSHaptic,
  resolveAndroidHaptic,
  useHaptics,
} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {ANDROID_API_LEVEL, IS_ANDROID} from '#/env'

const IOS_HAPTICS: IOSHaptic[] = [
  'light',
  'medium',
  'heavy',
  'soft',
  'rigid',
  'selection',
  'success',
  'warning',
  'error',
]

const ANDROID_HAPTICS = Object.values(AndroidHaptics) as AndroidHaptic[]

/**
 * On Android, shows the fallback when this device doesn't have `haptic`.
 */
function describeAndroid(haptic: AndroidHaptic) {
  if (!IS_ANDROID) return haptic
  const resolved = resolveAndroidHaptic(haptic)
  return resolved === haptic ? haptic : `${haptic} → ${resolved ?? 'nothing'}`
}

export function Haptics() {
  const t = useTheme()
  const haptics = useHaptics()

  return (
    <View style={[a.gap_md]}>
      <Text style={[a.font_bold, a.text_5xl]}>Haptics</Text>
      {IS_ANDROID && (
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          Android API level {ANDROID_API_LEVEL}. Arrows show the fallback for
          constants this device doesn’t have.
        </Text>
      )}

      <Text style={[a.font_bold, a.text_2xl]}>Intents</Text>
      <View style={[a.gap_sm]}>
        {Object.entries(HAPTIC_INTENTS).map(([name, haptic]) => (
          <View key={name} style={[a.flex_row, a.align_center, a.gap_md]}>
            <Button
              label={`${name} haptic`}
              size="small"
              color="primary"
              onPress={() => haptics.platform(haptic)}>
              <ButtonText>{name}</ButtonText>
            </Button>
            <Text style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}>
              iOS: {haptic.ios} · Android: {describeAndroid(haptic.android)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[a.font_bold, a.text_2xl]}>iOS</Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        Impact styles, notification types, and selection
      </Text>
      <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
        {IOS_HAPTICS.map(haptic => (
          <Button
            key={haptic}
            label={`${haptic} haptic`}
            size="small"
            color="secondary"
            onPress={() => haptics.platform({ios: haptic})}>
            <ButtonText>{haptic}</ButtonText>
          </Button>
        ))}
      </View>

      <Text style={[a.font_bold, a.text_2xl]}>Android</Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        performHapticFeedback constants
      </Text>
      <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
        {ANDROID_HAPTICS.map(haptic => (
          <Button
            key={haptic}
            label={`${haptic} haptic`}
            size="small"
            color="secondary"
            onPress={() => haptics.platform({android: haptic})}>
            <ButtonText>{describeAndroid(haptic)}</ButtonText>
          </Button>
        ))}
      </View>
    </View>
  )
}

import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useHapticsDisabled,
  useRequireAltTextEnabled,
  useSetHapticsDisabled,
  useSetRequireAltTextEnabled,
} from '#/state/preferences'
import {
  useLargeAltBadgeEnabled,
  useSetLargeAltBadgeEnabled,
} from '#/state/preferences/large-alt-badge'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {BetaTag} from '#/components/BetaTag'
import * as Toggle from '#/components/forms/Toggle'
import {Accessibility_Stroke2_Corner2_Rounded as AccessibilityIcon} from '#/components/icons/Accessibility'
import {Haptic_Stroke2_Corner2_Rounded as HapticIcon} from '#/components/icons/Haptic'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {
  useAltTextGenerationPref,
  useIsAltTextGenerationAvailable,
} from '#/features/altTextGeneration'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AccessibilitySettings'
>
export function AccessibilitySettingsScreen({}: Props) {
  const t = useTheme()
  const ax = useAnalytics()
  const {t: l} = useLingui()

  const requireAltTextEnabled = useRequireAltTextEnabled()
  const setRequireAltTextEnabled = useSetRequireAltTextEnabled()
  const hapticsDisabled = useHapticsDisabled()
  const setHapticsDisabled = useSetHapticsDisabled()
  const largeAltBadgeEnabled = useLargeAltBadgeEnabled()
  const setLargeAltBadgeEnabled = useSetLargeAltBadgeEnabled()
  const isAltTextGenerationAvailable = useIsAltTextGenerationAvailable()
  const [altTextGenerationEnabled, setAltTextGenerationEnabled] =
    useAltTextGenerationPref()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Accessibility</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={AccessibilityIcon} />
            <SettingsList.ItemText>
              <Trans>Alt text</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="require_alt_text"
              label={l`Require alt text before posting`}
              value={requireAltTextEnabled ?? false}
              onChange={value => setRequireAltTextEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Require alt text before posting</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="large_alt_badge"
              label={l`Display larger alt text badges`}
              value={!!largeAltBadgeEnabled}
              onChange={value => setLargeAltBadgeEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Display larger alt text badges</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            {isAltTextGenerationAvailable && (
              <Toggle.Item
                name="alt_text_generation"
                label={l`Suggest alt text for images`}
                value={altTextGenerationEnabled === true}
                onChange={value => {
                  setAltTextGenerationEnabled(value)
                  ax.metric('altTextGeneration:toggle', {enabled: value})
                }}
                style={[a.w_full]}>
                <View style={[a.flex_1, a.gap_2xs]}>
                  <View
                    style={[a.flex_row, a.flex_wrap, a.align_center, a.gap_sm]}>
                    <Toggle.LabelText>
                      <Trans>Suggest alt text for images</Trans>
                    </Toggle.LabelText>
                    <BetaTag label={l`Experimental`} />
                  </View>
                  <Text
                    style={[
                      a.text_sm,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}>
                    <Trans>
                      Drafts alt text as soon as you add an image to a post.
                      Suggestions are generated entirely on your device by its
                      built-in model, without sending your images anywhere.
                      Check them before posting.
                    </Trans>
                  </Text>
                </View>
                <Toggle.Platform />
              </Toggle.Item>
            )}
          </SettingsList.Group>
          {IS_NATIVE && (
            <>
              <SettingsList.Divider />
              <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
                <SettingsList.ItemIcon icon={HapticIcon} />
                <SettingsList.ItemText>
                  <Trans>Haptics</Trans>
                </SettingsList.ItemText>
                <Toggle.Item
                  name="haptics"
                  label={l`Disable haptic feedback`}
                  value={hapticsDisabled ?? false}
                  onChange={value => setHapticsDisabled(value)}
                  style={[a.w_full]}>
                  <Toggle.LabelText style={[a.flex_1]}>
                    <Trans>Disable haptic feedback</Trans>
                  </Toggle.LabelText>
                  <Toggle.Platform />
                </Toggle.Item>
              </SettingsList.Group>
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

import {useState} from 'react'
import {Linking, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {FEEDBACK_FORM_URL} from '#/lib/constants'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {logger} from '#/logger'
import {
  usePreferencesQuery,
  useSetIsBetaUserMutation,
} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import * as Layout from '#/components/Layout'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {features} from '#/analytics'
import {getTargetedFeatures} from '#/analytics/features'
import {device} from '#/storage'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'BetaFeaturesSettings'
>
export function BetaFeaturesSettingsScreen({}: Props) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const {currentAccount} = useSession()
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: setIsBetaUser} = useSetIsBetaUserMutation()
  const isBetaUser = preferences?.bskyAppState?.isBetaUser ?? false
  const [isPending, setIsPending] = useState(false)

  const betaFeatures = getTargetedFeatures(i18n)

  const onChange = async (next: boolean) => {
    try {
      setIsPending(true)
      await setIsBetaUser(next)
      /*
       * Cache the new value so analytics can set the `isBetaUser` GrowthBook
       * attribute synchronously on the next boot, before beta-gated features
       * are evaluated.
       */
      device.set(['isBetaUser'], next)
      // re-evaluate feature gates against the new attribute in-session
      void features.refresh({strategy: 'prefer-fresh-gates'})
    } catch (e) {
      logger.error('Failed to toggle beta features', {safeMessage: e})
      Toast.show(l`Something went wrong, please try again.`, {type: 'error'})
    } finally {
      setIsPending(false)
    }
  }

  const onPressShareFeedback = () => {
    void Linking.openURL(
      FEEDBACK_FORM_URL({
        email: currentAccount?.email,
        handle: currentAccount?.handle,
      }),
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Beta features</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <Toggle.Item
            name="enable_beta_features"
            label={l`Enable beta features`}
            value={isBetaUser}
            disabled={isPending}
            onChange={value => void onChange(value)}>
            <SettingsList.Item>
              <View style={[a.flex_1, a.gap_2xs]}>
                <SettingsList.ItemText style={[a.font_semi_bold]}>
                  <Trans>Enable beta features</Trans>
                </SettingsList.ItemText>
                <Text
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>
                    Get early access to experimental features we’re testing.
                  </Trans>
                </Text>
              </View>
              <Toggle.Platform />
            </SettingsList.Item>
          </Toggle.Item>

          <View style={[a.px_xl, a.gap_md]}>
            <Admonition type="info">
              <Trans>
                Beta features may be unstable. Some changes may require
                restarting the app.
              </Trans>
            </Admonition>

            <Button
              disabled={!isBetaUser || betaFeatures.length < 1 || isPending}
              label={l`Share feedback`}
              size="medium"
              color="primary_subtle"
              onPress={onPressShareFeedback}
              style={[a.self_start, a.mt_xs, a.mb_xl]}>
              <ButtonText>
                <Trans>Share feedback</Trans>
              </ButtonText>
            </Button>

            {betaFeatures.length < 1 ? (
              <View style={[a.align_center, a.gap_xs, a.py_4xl]}>
                <BeakerIcon
                  size="4xl"
                  fill={t.palette.contrast_100}
                  style={[a.mb_md]}
                />
                <Text style={[a.text_md, a.font_semi_bold, a.leading_snug]}>
                  <Trans>No beta features at the moment.</Trans>
                </Text>
                <Text
                  style={[a.text_sm, t.atoms.text_contrast_high]}
                  emoji={false}>
                  <Trans>Check back later!</Trans>
                </Text>
              </View>
            ) : (
              <>
                <Text style={[a.text_md, a.font_semi_bold]}>
                  <Trans>Current beta features</Trans>
                </Text>
                <View style={[a.gap_sm]}>
                  {betaFeatures.map(feature => (
                    <View
                      key={feature.key}
                      style={[
                        a.p_md,
                        a.rounded_md,
                        a.border,
                        t.atoms.border_contrast_low,
                      ]}>
                      <Text
                        style={[
                          a.text_md,
                          a.font_medium,
                          a.pb_2xs,
                          t.atoms.text_contrast_high,
                        ]}>
                        {feature.name}
                      </Text>
                      <Text
                        style={[
                          a.text_sm,
                          a.leading_snug,
                          t.atoms.text_contrast_high,
                        ]}>
                        {feature.description}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

import {useState} from 'react'
import {View} from 'react-native'
import {type ProfileViewBasic} from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {usePalette} from '#/lib/hooks/usePalette'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {type Gate} from '#/lib/statsig/gates'
import {
  resetBlackskyGateCache,
  useDangerousSetGate,
  useGatesCache,
} from '#/lib/statsig/statsig'
import {isWeb} from '#/platform/detection'
import {setGeolocation, useGeolocation} from '#/state/geolocation'
import * as persisted from '#/state/persisted'
import {useGoLinksEnabled, useSetGoLinksEnabled} from '#/state/preferences'
import {
  useBlackskyVerificationEnabled,
  useBlackskyVerificationTrusted,
  useSetBlackskyVerificationEnabled,
} from '#/state/preferences/blacksky-verification'
import {
  useConstellationEnabled,
  useSetConstellationEnabled,
} from '#/state/preferences/constellation-enabled'
import {
  useConstellationInstance,
  useSetConstellationInstance,
} from '#/state/preferences/constellation-instance'
import {
  useDirectFetchRecords,
  useSetDirectFetchRecords,
} from '#/state/preferences/direct-fetch-records'
import {
  useHideFollowNotifications,
  useSetHideFollowNotifications,
} from '#/state/preferences/hide-follow-notifications'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  useNoAppLabelers,
  useSetNoAppLabelers,
} from '#/state/preferences/no-app-labelers'
import {
  useNoDiscoverFallback,
  useSetNoDiscoverFallback,
} from '#/state/preferences/no-discover-fallback'
import {
  useRepostCarouselEnabled,
  useSetRepostCarouselEnabled,
} from '#/state/preferences/repost-carousel-enabled'
import {
  useSetShowLinkInHandle,
  useShowLinkInHandle,
} from '#/state/preferences/show-link-in-handle.tsx'
import {useProfilesQuery} from '#/state/queries/profile'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useBreakpoints} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Atom_Stroke2_Corner0_Rounded as BlackskyIcon} from '#/components/icons/Atom'
import {Bell_Stroke2_Corner0_Rounded as BellIcon} from '#/components/icons/Bell'
import {Eye_Stroke2_Corner0_Rounded as VisibilityIcon} from '#/components/icons/Eye'
import {Earth_Stroke2_Corner2_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Lab_Stroke2_Corner0_Rounded as BeakerIcon} from '#/components/icons/Lab'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {RaisingHand4Finger_Stroke2_Corner0_Rounded as RaisingHandIcon} from '#/components/icons/RaisingHand'
import {Star_Stroke2_Corner0_Rounded as StarIcon} from '#/components/icons/Star'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {SearchProfileCard} from '../Search/components/SearchProfileCard'

type Props = NativeStackScreenProps<CommonNavigatorParams>

function GeolocationSettingsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {_} = useLingui()

  const [hasChanged, setHasChanged] = useState(false)
  const [countryCode, setCountryCode] = useState('')

  const submit = () => {
    setGeolocation({countryCode})
    control.close()
  }

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Geolocation ISO 3166-1 Code`)}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Geolocation ISO 3166-1 Code</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            value={countryCode}
            onChangeText={value => {
              setCountryCode(value.toUpperCase())
              setHasChanged(true)
            }}
            maxLength={2}
            placeholder="BR"
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={submit}
            accessibilityHint={_(
              msg`Input 2 letter ISO 3166-1 country code to use as location`,
            )}
          />

          <View style={isWeb && [a.flex_row, a.justify_end]}>
            <Button
              label={hasChanged ? _(msg`Save location`) : _(msg`Done`)}
              size="large"
              onPress={submit}
              variant="solid"
              color="primary">
              <ButtonText>
                {hasChanged ? <Trans>Save</Trans> : <Trans>Done</Trans>}
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function ConstellationInstanceDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const pal = usePalette('default')
  const {_} = useLingui()

  const [url, setUrl] = useState('')
  const setConstellationInstance = useSetConstellationInstance()

  const submit = () => {
    setConstellationInstance(url)
    control.close()
  }

  const shouldDisable = () => {
    try {
      return !new URL(url).hostname.includes('.')
    } catch (e) {
      return true
    }
  }

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{preventExpansion: true}}
      onClose={() => setUrl('')}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Constellations instance URL`)}>
        <View style={[a.gap_sm, a.pb_lg]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Constellations instance URL</Trans>
          </Text>
        </View>

        <View style={a.gap_lg}>
          <Dialog.Input
            label="Text input field"
            autoFocus
            style={[styles.textInput, pal.border, pal.text]}
            onChangeText={value => {
              setUrl(value)
            }}
            placeholder={persisted.defaults.constellationInstance}
            placeholderTextColor={pal.colors.textLight}
            onSubmitEditing={submit}
            accessibilityHint={_(
              msg`Input the url of the constellations instance to use`,
            )}
          />

          <View style={isWeb && [a.flex_row, a.justify_end]}>
            <Button
              label={_(msg`Save`)}
              size="large"
              onPress={submit}
              variant="solid"
              color="primary"
              disabled={shouldDisable()}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

const TrustedVerifiers = (): React.ReactNode => {
  const trusted = useBlackskyVerificationTrusted()
  const moderationOpts = useModerationOpts()

  const results = useProfilesQuery({
    handles: Array.from(trusted),
  })

  const {gtMobile} = useBreakpoints()

  return (
    results.data &&
    moderationOpts !== undefined && (
      <View style={[gtMobile ? a.pl_md : a.pl_sm, a.pb_sm]}>
        {results.data.profiles.map(profile => (
          <SearchProfileCard
            key={profile.did}
            profile={profile as ProfileViewBasic}
            moderationOpts={moderationOpts}
          />
        ))}
      </View>
    )
  )
}

export function BlackskySettingsScreen({}: Props) {
  const {_} = useLingui()

  const goLinksEnabled = useGoLinksEnabled()
  const setGoLinksEnabled = useSetGoLinksEnabled()

  const constellationEnabled = useConstellationEnabled()
  const setConstellationEnabled = useSetConstellationEnabled()

  const directFetchRecords = useDirectFetchRecords()
  const setDirectFetchRecords = useSetDirectFetchRecords()

  const noAppLabelers = useNoAppLabelers()
  const setNoAppLabelers = useSetNoAppLabelers()

  const noDiscoverFallback = useNoDiscoverFallback()
  const setNoDiscoverFallback = useSetNoDiscoverFallback()

  const hideFollowNotifications = useHideFollowNotifications()
  const setHideFollowNotifications = useSetHideFollowNotifications()

  const location = useGeolocation()
  const setLocationControl = Dialog.useDialogControl()

  const constellationInstance = useConstellationInstance()
  const setConstellationInstanceControl = Dialog.useDialogControl()

  const blackskyVerificationEnabled = useBlackskyVerificationEnabled()
  const setBlackskyVerificationEnabled = useSetBlackskyVerificationEnabled()

  const repostCarouselEnabled = useRepostCarouselEnabled()
  const setRepostCarouselEnabled = useSetRepostCarouselEnabled()

  const showLinkInHandle = useShowLinkInHandle()
  const setShowLinkInHandle = useSetShowLinkInHandle()

  const [gates, setGatesView] = useState(Object.fromEntries(useGatesCache()))
  const dangerousSetGate = useDangerousSetGate()
  const setGate = (gate: Gate, value: boolean) => {
    dangerousSetGate(gate, value)
    setGatesView({
      ...gates,
      [gate]: value,
    })
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Blacksky</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={BlackskyIcon} />
            <SettingsList.ItemText>
              <Trans>Redirects</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="use_go_links"
              label={_(msg`Redirect through go.bsky.app`)}
              value={goLinksEnabled ?? false}
              onChange={value => setGoLinksEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Redirect through go.bsky.app</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={VisibilityIcon} />
            <SettingsList.ItemText>
              <Trans>Visibility</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="direct_fetch_records"
              label={_(
                msg`Fetch records directly from PDS to see through quote blocks`,
              )}
              value={directFetchRecords}
              onChange={value => setDirectFetchRecords(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  Fetch records directly from PDS to see contents of blocked and
                  detatched quotes
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="constellation_fallback"
              label={_(
                msg`Fall back to constellation api to find blocked replies`,
              )}
              disabled={true}
              value={constellationEnabled}
              onChange={value => setConstellationEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  TODO: Fall back to constellation api to find blocked replies
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={VerifiedIcon} />
            <SettingsList.ItemText>
              <Trans>Verification</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="custom_verifications"
              label={_(
                msg`Select your own set of trusted verifiers, and operate as a verifier`,
              )}
              value={blackskyVerificationEnabled}
              onChange={value => setBlackskyVerificationEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  Select your own set of trusted verifiers, and operate as a
                  verifier
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <Trans>
                WIP. May slow down the client or fail to find all labels. Revoke
                and grant trust in the meatball menu on a profile.{' '}
                {blackskyVerificationEnabled
                  ? 'You currently'
                  : 'If enabled, you would'}{' '}
                trust the following verifiers:
              </Trans>
            </Admonition>
          </SettingsList.Item>

          <TrustedVerifiers />

          <SettingsList.Item>
            <SettingsList.ItemIcon icon={StarIcon} />
            <SettingsList.ItemText>
              <Trans>{`Constellation Instance`}</Trans>
            </SettingsList.ItemText>
            <SettingsList.BadgeButton
              label={_(msg`Change`)}
              onPress={() => setConstellationInstanceControl.open()}
            />
          </SettingsList.Item>
          <SettingsList.Item>
            <Admonition type="info" style={[a.flex_1]}>
              <Trans>
                Constellation is used to supplement AppView responses for custom
                verifications and nuclear block bypass, via backlinks. Current
                instance: {constellationInstance}
              </Trans>
            </Admonition>
          </SettingsList.Item>

          <SettingsList.Item>
            <SettingsList.ItemIcon icon={GlobeIcon} />
            <SettingsList.ItemText>
              <Trans>{`ISO 3166-1 Location (currently ${
                location.geolocation?.countryCode ?? '?'
              })`}</Trans>
            </SettingsList.ItemText>
            <SettingsList.BadgeButton
              label={_(msg`Change`)}
              onPress={() => setLocationControl.open()}
            />
          </SettingsList.Item>
          <SettingsList.Item>
            <Admonition type="info" style={[a.flex_1]}>
              <Trans>
                Geolocation country code informs required regional app labelers
                and currency behavior.
              </Trans>
            </Admonition>
          </SettingsList.Item>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={RaisingHandIcon} />
            <SettingsList.ItemText>
              <Trans>Labelers</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="no_app_labelers"
              label={_(msg`Do not declare any app labelers`)}
              value={noAppLabelers}
              onChange={value => setNoAppLabelers(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Do not declare any default app labelers</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <Trans>Restart app after changing this setting.</Trans>
            </Admonition>
          </SettingsList.Item>
          <SettingsList.Item>
            <Admonition type="tip" style={[a.flex_1]}>
              <Trans>
                Some appviews will default to using an app labeler if you have
                no labelers, so consider subscribing to at least one labeler if
                you have issues.
              </Trans>
            </Admonition>
          </SettingsList.Item>
          <SettingsList.Item>
            <Admonition type="info" style={[a.flex_1]}>
              <Trans>
                App labelers are mandatory top-level labelers that can perform
                "takedowns". This setting does not influence geolocation based
                labelers.
              </Trans>
            </Admonition>
          </SettingsList.Item>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={PaintRollerIcon} />
            <SettingsList.ItemText>
              <Trans>Tweaks</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="repost_carousel"
              label={_(msg`Combine reposts into a horizontal carousel`)}
              value={repostCarouselEnabled}
              onChange={value => setRepostCarouselEnabled(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Combine reposts into a horizontal carousel</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="no_discover_fallback"
              label={_(msg`Do not fall back to discover feed`)}
              value={noDiscoverFallback}
              onChange={value => setNoDiscoverFallback(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Do not fall back to discover feed</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              name="show_link_in_handle"
              label={_(
                msg`On non-bsky.social handles, show a link to that URL`,
              )}
              value={showLinkInHandle}
              onChange={value => setShowLinkInHandle(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>
                  On non-bsky.social handles, show a link to that URL
                </Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={BellIcon} />
            <SettingsList.ItemText>
              <Trans>Notification Filters</Trans>
            </SettingsList.ItemText>
            <Toggle.Item
              name="hide_follow_notifications"
              label={_(msg`Hide follow notifications`)}
              value={hideFollowNotifications ?? false}
              onChange={value => setHideFollowNotifications(value)}
              style={[a.w_full]}>
              <Toggle.LabelText style={[a.flex_1]}>
                <Trans>Hide follow notifications</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </SettingsList.Group>

          <SettingsList.Group contentContainerStyle={[a.gap_sm]}>
            <SettingsList.ItemIcon icon={BeakerIcon} />
            <SettingsList.ItemText>
              <Trans>Gates</Trans>
            </SettingsList.ItemText>
            {Object.entries(gates).map(([gate, status]) => (
              <Toggle.Item
                key={gate}
                name={gate}
                label={gate}
                value={status}
                onChange={value => setGate(gate as Gate, value)}
                style={[a.w_full]}>
                <Toggle.LabelText style={[a.flex_1]}>{gate}</Toggle.LabelText>
                <Toggle.Platform />
              </Toggle.Item>
            ))}
            <SettingsList.BadgeButton
              label={_(msg`Reset gates`)}
              onPress={() => {
                resetBlackskyGateCache()
                setGatesView({})
              }}
            />
          </SettingsList.Group>

          <SettingsList.Item>
            <Admonition type="warning" style={[a.flex_1]}>
              <Trans>
                These settings might summon nasel demons! Restart the app after
                changing if anything breaks.
              </Trans>
            </Admonition>
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
      <GeolocationSettingsDialog control={setLocationControl} />
      <ConstellationInstanceDialog control={setConstellationInstanceControl} />
    </Layout.Screen>
  )
}

const styles = {
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
}

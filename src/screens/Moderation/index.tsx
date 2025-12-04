import {Fragment, useCallback} from 'react'
import {Linking, View} from 'react-native'
import {LABELS} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {getLabelingServiceTitle} from '#/lib/moderation'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {useIsBirthdateUpdateAllowed} from '#/state/birthdate'
import {
  useMyLabelersQuery,
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
  usePreferencesSetAdultContentMutation,
} from '#/state/queries/preferences'
import {isNonConfigurableModerationAuthority} from '#/state/session/additional-moderation-authorities'
import {useSetMinimalShellMode} from '#/state/shell'
import {atoms as a, useBreakpoints, useTheme, type ViewStyleProp} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {AgeAssuranceAdmonition} from '#/components/ageAssurance/AgeAssuranceAdmonition'
import {useAgeAssuranceCopy} from '#/components/ageAssurance/useAgeAssuranceCopy'
import {Button} from '#/components/Button'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheck} from '#/components/icons/CircleCheck'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {EditBig_Stroke2_Corner0_Rounded as EditBig} from '#/components/icons/EditBig'
import {Filter_Stroke2_Corner0_Rounded as Filter} from '#/components/icons/Filter'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import * as LabelingService from '#/components/LabelingServiceCard'
import * as Layout from '#/components/Layout'
import {InlineLinkText, Link} from '#/components/Link'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {GlobalLabelPreference} from '#/components/moderation/LabelPreference'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'

function ErrorState({error}: {error: string}) {
  const t = useTheme()
  return (
    <View style={[a.p_xl]}>
      <Text
        style={[
          a.text_md,
          a.leading_normal,
          a.pb_md,
          t.atoms.text_contrast_medium,
        ]}>
        <Trans>
          Hmmmm, it seems we're having trouble loading this data. See below for
          more details. If this issue persists, please contact us.
        </Trans>
      </Text>
      <View
        style={[
          a.relative,
          a.py_md,
          a.px_lg,
          a.rounded_md,
          a.mb_2xl,
          t.atoms.bg_contrast_25,
        ]}>
        <Text style={[a.text_md, a.leading_normal]}>{error}</Text>
      </View>
    </View>
  )
}

export function ModerationScreen(
  _props: NativeStackScreenProps<CommonNavigatorParams, 'Moderation'>,
) {
  const {_} = useLingui()
  const {
    isLoading: isPreferencesLoading,
    error: preferencesError,
    data: preferences,
  } = usePreferencesQuery()

  const isLoading = isPreferencesLoading
  const error = preferencesError

  return (
    <Layout.Screen testID="moderationScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Moderation</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        {isLoading ? (
          <ListMaybePlaceholder isLoading={true} sideBorders={false} />
        ) : error || !preferences ? (
          <ErrorState
            error={
              preferencesError?.toString() ||
              _(msg`Something went wrong, please try again.`)
            }
          />
        ) : (
          <ModerationScreenInner preferences={preferences} />
        )}
      </Layout.Content>
    </Layout.Screen>
  )
}

function SubItem({
  title,
  icon: Icon,
  style,
}: ViewStyleProp & {
  title: string
  icon: React.ComponentType<SVGIconProps>
}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.p_lg,
        a.gap_sm,
        style,
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_md]}>
        <Icon size="md" style={[t.atoms.text_contrast_medium]} />
        <Text style={[a.text_sm, a.font_semi_bold]}>{title}</Text>
      </View>
      <ChevronRight
        size="sm"
        style={[t.atoms.text_contrast_low, a.self_end, {paddingBottom: 2}]}
      />
    </View>
  )
}

export function ModerationScreenInner({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const {_} = useLingui()
  const t = useTheme()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {gtMobile} = useBreakpoints()
  const {mutedWordsDialogControl} = useGlobalDialogsControlContext()
  const {
    isLoading: isLabelersLoading,
    data: labelers,
    error: labelersError,
  } = useMyLabelersQuery()
  const aa = useAgeAssurance()
  const isBirthdateUpdateAllowed = useIsBirthdateUpdateAllowed()
  const aaCopy = useAgeAssuranceCopy()

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const {mutateAsync: setAdultContentPref, variables: optimisticAdultContent} =
    usePreferencesSetAdultContentMutation()
  let adultContentEnabled = !!(
    (optimisticAdultContent && optimisticAdultContent.enabled) ||
    (!optimisticAdultContent && preferences.moderationPrefs.adultContentEnabled)
  )
  const adultContentUIDisabledOnIOS = isIOS && !adultContentEnabled
  let adultContentUIDisabled = adultContentUIDisabledOnIOS

  if (aa.flags.adultContentDisabled) {
    adultContentEnabled = false
    adultContentUIDisabled = true
  }

  const onToggleAdultContentEnabled = useCallback(
    async (selected: boolean) => {
      try {
        await setAdultContentPref({
          enabled: selected,
        })
      } catch (e: any) {
        logger.error(`Failed to set adult content pref`, {
          message: e.message,
        })
      }
    },
    [setAdultContentPref],
  )

  return (
    <View style={[a.pt_2xl, a.px_lg, gtMobile && a.px_2xl]}>
      {aa.flags.adultContentDisabled && isBirthdateUpdateAllowed && (
        <View style={[a.pb_2xl]}>
          <Admonition type="tip" style={[a.pb_md]}>
            <Trans>
              Your declared age is under 18. Some settings below may be
              disabled. If this was a mistake, you may edit your birthdate in
              your{' '}
              <InlineLinkText
                to="/settings/account"
                label={_(msg`Go to account settings`)}>
                account settings
              </InlineLinkText>
              .
            </Trans>
          </Admonition>
        </View>
      )}

      <Text
        style={[
          a.text_md,
          a.font_semi_bold,
          a.pb_md,
          t.atoms.text_contrast_high,
        ]}>
        <Trans>Moderation tools</Trans>
      </Text>

      <View
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
        ]}>
        <Link
          label={_(msg`View your default post interaction settings`)}
          testID="interactionSettingsBtn"
          to="/moderation/interaction-settings">
          {state => (
            <SubItem
              title={_(msg`Interaction settings`)}
              icon={EditBig}
              style={[
                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
              ]}
            />
          )}
        </Link>
        <Divider />
        <Button
          testID="mutedWordsBtn"
          label={_(msg`Open muted words and tags settings`)}
          onPress={() => mutedWordsDialogControl.open()}>
          {state => (
            <SubItem
              title={_(msg`Muted words & tags`)}
              icon={Filter}
              style={[
                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
              ]}
            />
          )}
        </Button>
        <Divider />
        <Link
          label={_(msg`View your moderation lists`)}
          testID="moderationlistsBtn"
          to="/moderation/modlists">
          {state => (
            <SubItem
              title={_(msg`Moderation lists`)}
              icon={Group}
              style={[
                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
              ]}
            />
          )}
        </Link>
        <Divider />
        <Link
          label={_(msg`View your muted accounts`)}
          testID="mutedAccountsBtn"
          to="/moderation/muted-accounts">
          {state => (
            <SubItem
              title={_(msg`Muted accounts`)}
              icon={Person}
              style={[
                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
              ]}
            />
          )}
        </Link>
        <Divider />
        <Link
          label={_(msg`View your blocked accounts`)}
          testID="blockedAccountsBtn"
          to="/moderation/blocked-accounts">
          {state => (
            <SubItem
              title={_(msg`Blocked accounts`)}
              icon={CircleBanSign}
              style={[
                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
              ]}
            />
          )}
        </Link>
        <Divider />
        <Link
          label={_(msg`Manage verification settings`)}
          testID="verificationSettingsBtn"
          to="/moderation/verification-settings">
          {state => (
            <SubItem
              title={_(msg`Verification settings`)}
              icon={CircleCheck}
              style={[
                (state.hovered || state.pressed) && [t.atoms.bg_contrast_50],
              ]}
            />
          )}
        </Link>
      </View>

      <Text
        style={[
          a.pt_2xl,
          a.pb_md,
          a.text_md,
          a.font_semi_bold,
          t.atoms.text_contrast_high,
        ]}>
        <Trans>Content filters</Trans>
      </Text>

      <AgeAssuranceAdmonition style={[a.pb_md]}>
        {aaCopy.notice}
      </AgeAssuranceAdmonition>

      <View style={[a.gap_md]}>
        <View
          style={[
            a.w_full,
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
          ]}>
          {aa.state.access === aa.Access.Full && (
            <>
              <View
                style={[
                  a.py_lg,
                  a.px_lg,
                  a.flex_row,
                  a.align_center,
                  a.justify_between,
                  adultContentUIDisabled && {opacity: 0.5},
                ]}>
                <Text style={[a.font_semi_bold, t.atoms.text_contrast_high]}>
                  <Trans>Enable adult content</Trans>
                </Text>
                <Toggle.Item
                  label={_(msg`Toggle to enable or disable adult content`)}
                  disabled={adultContentUIDisabled}
                  name="adultContent"
                  value={adultContentEnabled}
                  onChange={onToggleAdultContentEnabled}>
                  <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                    <Text style={[t.atoms.text_contrast_medium]}>
                      {adultContentEnabled ? (
                        <Trans>Enabled</Trans>
                      ) : (
                        <Trans>Disabled</Trans>
                      )}
                    </Text>
                    <Toggle.Switch />
                  </View>
                </Toggle.Item>
              </View>
              {adultContentUIDisabledOnIOS && (
                <View style={[a.pb_lg, a.px_lg]}>
                  <Text>
                    <Trans>
                      Adult content can only be enabled via the Web at{' '}
                      <InlineLinkText
                        label={_(msg`The Bluesky web application`)}
                        to=""
                        onPress={evt => {
                          evt.preventDefault()
                          Linking.openURL('https://bsky.app/')
                          return false
                        }}>
                        bsky.app
                      </InlineLinkText>
                      .
                    </Trans>
                  </Text>
                </View>
              )}

              {adultContentEnabled && (
                <>
                  <Divider />
                  <GlobalLabelPreference labelDefinition={LABELS.porn} />
                  <Divider />
                  <GlobalLabelPreference labelDefinition={LABELS.sexual} />
                  <Divider />
                  <GlobalLabelPreference
                    labelDefinition={LABELS['graphic-media']}
                  />
                  <Divider />
                  <GlobalLabelPreference labelDefinition={LABELS.nudity} />
                </>
              )}
            </>
          )}
        </View>
      </View>

      <Text
        style={[
          a.text_md,
          a.font_semi_bold,
          a.pt_2xl,
          a.pb_md,
          t.atoms.text_contrast_high,
        ]}>
        <Trans>Advanced</Trans>
      </Text>

      {isLabelersLoading ? (
        <View style={[a.w_full, a.align_center, a.p_lg]}>
          <Loader size="xl" />
        </View>
      ) : labelersError || !labelers ? (
        <View style={[a.p_lg, a.rounded_sm, t.atoms.bg_contrast_25]}>
          <Text>
            <Trans>
              We were unable to load your configured labelers at this time.
            </Trans>
          </Text>
        </View>
      ) : (
        <View style={[a.rounded_sm, t.atoms.bg_contrast_25]}>
          {labelers.map((labeler, i) => {
            return (
              <Fragment key={labeler.creator.did}>
                {i !== 0 && <Divider />}
                <LabelingService.Link labeler={labeler}>
                  {state => (
                    <LabelingService.Outer
                      style={[
                        i === 0 && {
                          borderTopLeftRadius: a.rounded_sm.borderRadius,
                          borderTopRightRadius: a.rounded_sm.borderRadius,
                        },
                        i === labelers.length - 1 && {
                          borderBottomLeftRadius: a.rounded_sm.borderRadius,
                          borderBottomRightRadius: a.rounded_sm.borderRadius,
                        },
                        (state.hovered || state.pressed) && [
                          t.atoms.bg_contrast_50,
                        ],
                      ]}>
                      <LabelingService.Avatar avatar={labeler.creator.avatar} />
                      <LabelingService.Content>
                        <LabelingService.Title
                          value={getLabelingServiceTitle({
                            displayName: labeler.creator.displayName,
                            handle: labeler.creator.handle,
                          })}
                        />
                        <LabelingService.Description
                          value={labeler.creator.description}
                          handle={labeler.creator.handle}
                        />
                        {isNonConfigurableModerationAuthority(
                          labeler.creator.did,
                        ) && <LabelingService.RegionalNotice />}
                      </LabelingService.Content>
                    </LabelingService.Outer>
                  )}
                </LabelingService.Link>
              </Fragment>
            )
          })}
        </View>
      )}
      <View style={{height: 150}} />
    </View>
  )
}

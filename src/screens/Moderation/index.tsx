import React from 'react'
import {Linking, View} from 'react-native'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {LABELS} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {getLabelingServiceTitle} from '#/lib/moderation'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {logger} from '#/logger'
import {isIOS} from '#/platform/detection'
import {
  useMyLabelersQuery,
  usePreferencesQuery,
  UsePreferencesQueryResponse,
  usePreferencesSetAdultContentMutation,
} from '#/state/queries/preferences'
import {isNonConfigurableModerationAuthority} from '#/state/session/additional-moderation-authorities'
import {useSetMinimalShellMode} from '#/state/shell'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from '#/view/com/util/Views'
import {ScrollView} from '#/view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme, ViewStyleProp} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {BirthDateSettingsDialog} from '#/components/dialogs/BirthDateSettings'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Props as SVGIconProps} from '#/components/icons/common'
import {Filter_Stroke2_Corner0_Rounded as Filter} from '#/components/icons/Filter'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import * as LabelingService from '#/components/LabelingServiceCard'
import * as Layout from '#/components/Layout'
import {InlineLinkText, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {GlobalLabelPreference} from '#/components/moderation/LabelPreference'
import {Text} from '#/components/Typography'

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
  const t = useTheme()
  const {_} = useLingui()
  const {
    isLoading: isPreferencesLoading,
    error: preferencesError,
    data: preferences,
  } = usePreferencesQuery()
  const {gtMobile} = useBreakpoints()
  const {height} = useSafeAreaFrame()

  const isLoading = isPreferencesLoading
  const error = preferencesError

  return (
    <Layout.Screen testID="moderationScreen">
      <CenteredView
        testID="moderationScreen"
        style={[
          t.atoms.border_contrast_low,
          t.atoms.bg,
          {minHeight: height},
          ...(gtMobile ? [a.border_l, a.border_r] : []),
        ]}>
        <ViewHeader title={_(msg`Moderation`)} showOnDesktop />

        {isLoading ? (
          <View style={[a.w_full, a.align_center, a.pt_2xl]}>
            <Loader size="xl" fill={t.atoms.text.color} />
          </View>
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
      </CenteredView>
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
        <Text style={[a.text_sm, a.font_bold]}>{title}</Text>
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
  const birthdateDialogControl = Dialog.useDialogControl()
  const {
    isLoading: isLabelersLoading,
    data: labelers,
    error: labelersError,
  } = useMyLabelersQuery()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const {mutateAsync: setAdultContentPref, variables: optimisticAdultContent} =
    usePreferencesSetAdultContentMutation()
  const adultContentEnabled = !!(
    (optimisticAdultContent && optimisticAdultContent.enabled) ||
    (!optimisticAdultContent && preferences.moderationPrefs.adultContentEnabled)
  )
  const ageNotSet = !preferences.userAge
  const isUnderage = (preferences.userAge || 0) < 18

  const onToggleAdultContentEnabled = React.useCallback(
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

  const disabledOnIOS = isIOS && !adultContentEnabled

  return (
    <ScrollView
      contentContainerStyle={[
        a.border_0,
        a.pt_2xl,
        a.px_lg,
        gtMobile && a.px_2xl,
      ]}>
      <Text
        style={[a.text_md, a.font_bold, a.pb_md, t.atoms.text_contrast_high]}>
        <Trans>Moderation tools</Trans>
      </Text>

      <View
        style={[
          a.w_full,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
        ]}>
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
      </View>

      <Text
        style={[
          a.pt_2xl,
          a.pb_md,
          a.text_md,
          a.font_bold,
          t.atoms.text_contrast_high,
        ]}>
        <Trans>Content filters</Trans>
      </Text>

      <View style={[a.gap_md]}>
        {ageNotSet && (
          <>
            <Button
              label={_(msg`Confirm your birthdate`)}
              size="small"
              variant="solid"
              color="secondary"
              onPress={() => {
                birthdateDialogControl.open()
              }}
              style={[a.justify_between, a.rounded_md, a.px_lg, a.py_lg]}>
              <ButtonText>
                <Trans>Confirm your age:</Trans>
              </ButtonText>
              <ButtonText>
                <Trans>Set birthdate</Trans>
              </ButtonText>
            </Button>

            <BirthDateSettingsDialog control={birthdateDialogControl} />
          </>
        )}
        <View
          style={[
            a.w_full,
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
          ]}>
          {!ageNotSet && !isUnderage && (
            <>
              <View
                style={[
                  a.py_lg,
                  a.px_lg,
                  a.flex_row,
                  a.align_center,
                  a.justify_between,
                  disabledOnIOS && {opacity: 0.5},
                ]}>
                <Text style={[a.font_bold, t.atoms.text_contrast_high]}>
                  <Trans>Enable adult content</Trans>
                </Text>
                <Toggle.Item
                  label={_(msg`Toggle to enable or disable adult content`)}
                  disabled={disabledOnIOS}
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
              {disabledOnIOS && (
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
              <Divider />
            </>
          )}
          {!isUnderage && adultContentEnabled && (
            <>
              <GlobalLabelPreference labelDefinition={LABELS.porn} />
              <Divider />
              <GlobalLabelPreference labelDefinition={LABELS.sexual} />
              <Divider />
              <GlobalLabelPreference
                labelDefinition={LABELS['graphic-media']}
              />
              <Divider />
            </>
          )}
          <GlobalLabelPreference labelDefinition={LABELS.nudity} />
        </View>
      </View>

      <Text
        style={[
          a.text_md,
          a.font_bold,
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
              <React.Fragment key={labeler.creator.did}>
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
              </React.Fragment>
            )
          })}
        </View>
      )}
      <View style={{height: 200}} />
    </ScrollView>
  )
}

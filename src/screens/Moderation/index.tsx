import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {ComAtprotoLabelDefs, LabelPreference} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {LabelGroupDefinition, AppBskyModerationDefs} from '@atproto/api'

import {NativeStackScreenProps, CommonNavigatorParams} from '#/lib/routes/types'
import {CenteredView} from '#/view/com/util/Views'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {useAnalytics} from 'lib/analytics/analytics'
import {useSetMinimalShellMode} from '#/state/shell'
import {useSession} from '#/state/session'
import {
  useProfileQuery,
  useProfileUpdateMutation,
} from '#/state/queries/profile'
import {ScrollView} from '#/view/com/util/Views'

import {
  UsePreferencesQueryResponse,
  usePreferencesQuery,
  useSetContentLabelMutation,
} from '#/state/queries/preferences'
import {useModServicesInfoQuery} from '#/state/queries/modservice'

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {Divider} from '#/components/Divider'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {Text} from '#/components/Typography'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {InlineLink, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'
import * as Dialog from '#/components/Dialog'
import {Button} from '#/components/Button'
import {
  getLabelGroupsFromLabels,
  getModerationServiceTitle,
  useConfigurableLabelGroups,
} from '#/lib/moderation'

import {
  SettingsDialog,
  SettingsDialogProps,
} from '#/screens/Moderation/SettingsDialog'

export function ModerationScreen(
  _props: NativeStackScreenProps<CommonNavigatorParams, 'Moderation'>,
) {
  const t = useTheme()
  const {
    isLoading: isPreferencesLoading,
    // error: preferencesError,
    data: preferences,
  } = usePreferencesQuery()

  return isPreferencesLoading ? (
    <View style={[a.w_full, a.align_center]}>
      <Loader size="xl" fill={t.atoms.text.color} />
    </View>
  ) : preferences ? (
    <ModerationScreenIntermediate preferences={preferences} />
  ) : // TODO
  null
}

function ModerationScreenIntermediate({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const t = useTheme()
  const {
    isLoading: isModServicesLoading,
    data: modservices,
    // error: modservicesError,
  } = useModServicesInfoQuery({
    dids: preferences.moderationOpts.mods.map(m => m.did),
  })

  return isModServicesLoading ? (
    <View style={[a.w_full, a.align_center]}>
      <Loader size="xl" fill={t.atoms.text.color} />
    </View>
  ) : modservices ? (
    <ModerationScreenInner
      preferences={preferences}
      modservices={modservices}
    />
  ) : // TODO
  null
}

export function ModerationScreenInner({
  preferences,
  modservices,
}: {
  preferences: UsePreferencesQueryResponse
  modservices: AppBskyModerationDefs.ModServiceViewDetailed[]
}) {
  const t = useTheme()
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {gtMobile, gtTablet} = useBreakpoints()
  const labelGroupStrings = useLabelGroupStrings()
  const modSettingsDialogControl = Dialog.useDialogControl()

  const [settingsDialogProps, setSettingsDialogProps] =
    React.useState<SettingsDialogProps>({
      // @ts-ignore
      labelGroup: '',
      modservices: [],
    })

  useFocusEffect(
    React.useCallback(() => {
      screen('Moderation')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  const groups = useConfigurableLabelGroups()

  const didToModServiceMap = React.useMemo<
    Record<string, AppBskyModerationDefs.ModServiceViewDetailed>
  >(() => {
    return modservices.reduce((acc, modservice) => {
      return {
        ...acc,
        [modservice.creator.did]: modservice,
      }
    }, {})
  }, [modservices])
  const labelGroupToModServiceMap = React.useMemo(() => {
    const groups: Partial<Record<LabelGroupDefinition['id'], string[]>> = {}

    for (const modservice of modservices) {
      const labelGroups = getLabelGroupsFromLabels(
        modservice.policies.labelValues,
      )
      for (const group of labelGroups) {
        const g = (groups[group.id] = groups[group.id] || [])
        g.push(modservice.creator.did)
      }
    }

    return groups
  }, [modservices])

  const openModSettingsDialog = React.useCallback(
    ({labelGroup, modservices}: Omit<SettingsDialogProps, 'onComplete'>) => {
      setSettingsDialogProps({
        labelGroup,
        modservices,
      })
      modSettingsDialogControl.open()
    },
    [modSettingsDialogControl],
  )

  return (
    <CenteredView
      style={[
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg,
        ...(gtMobile ? [a.border_l, a.border_r] : []),
      ]}
      testID="moderationScreen">
      <Dialog.Outer control={modSettingsDialogControl}>
        <Dialog.Handle />
        <SettingsDialog {...settingsDialogProps} preferences={preferences} />
      </Dialog.Outer>

      <ViewHeader title={_(msg`Moderation`)} showOnDesktop />

      <ScrollView contentContainerStyle={[a.border_0]}>
        {!gtTablet && <Divider />}

        <Link
          testID="moderationlistsBtn"
          style={[a.flex_row, a.align_center, a.py_md, a.px_lg, a.gap_md]}
          to="/moderation/modlists">
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.p_md,
              a.rounded_full,
              t.atoms.bg_contrast_50,
            ]}>
            <Group size="md" style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text style={[a.text_md]}>
            <Trans>Moderation lists</Trans>
          </Text>
        </Link>

        <Divider />

        <Link
          testID="mutedAccountsBtn"
          style={[a.flex_row, a.align_center, a.py_md, a.px_lg, a.gap_md]}
          to="/moderation/muted-accounts">
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.p_md,
              a.rounded_full,
              t.atoms.bg_contrast_50,
            ]}>
            <Person size="md" style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text style={[a.text_md]}>
            <Trans>Muted accounts</Trans>
          </Text>
        </Link>

        <Divider />

        <Link
          testID="blockedAccountsBtn"
          style={[a.flex_row, a.align_center, a.py_md, a.px_lg, a.gap_md]}
          to="/moderation/blocked-accounts">
          <View
            style={[
              a.align_center,
              a.justify_center,
              a.p_md,
              a.rounded_full,
              t.atoms.bg_contrast_50,
            ]}>
            <CircleBanSign size="md" style={[t.atoms.text_contrast_medium]} />
          </View>
          <Text style={[a.text_md]}>
            <Trans>Blocked accounts</Trans>
          </Text>
        </Link>

        <Divider />

        <View style={[a.gap_sm, a.px_lg, a.py_lg]}>
          <Text style={[a.text_lg, a.font_bold, a.pb_sm]}>
            <Trans>Content filtering settings</Trans>
          </Text>

          {groups.map((def, i) => {
            const groupStrings = labelGroupStrings[def.id]
            const modDids = labelGroupToModServiceMap[def.id] || []
            const mods = modDids.map(did => didToModServiceMap[did])
            return (
              <React.Fragment key={def.id}>
                {i !== 0 && <Divider />}
                <LabelGroup
                  name={groupStrings.name}
                  description={groupStrings.description}
                  labelers={mods}
                  openModSettingsDialog={openModSettingsDialog}
                  preferences={preferences}
                  labelGroup={def.id}
                />
              </React.Fragment>
            )
          })}
        </View>

        <Divider />

        <Text style={[a.text_lg, a.font_bold, a.pl_lg, a.pt_lg, a.pb_sm]}>
          <Trans>Logged-out visibility</Trans>
        </Text>
        <PwiOptOut />

        <View style={{height: 200}} />
      </ScrollView>
    </CenteredView>
  )
}

function LabelGroup({
  labelGroup,
  name,
  description,
  labelers: mods,
  preferences,
  openModSettingsDialog,
}: {
  labelGroup: LabelGroupDefinition['id']
  name: string
  description: string
  labelers: AppBskyModerationDefs.ModServiceViewDetailed[]
  preferences: UsePreferencesQueryResponse
  openModSettingsDialog: (props: SettingsDialogProps) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {mutateAsync: setContentLabelPref, variables: optimisticContentLabel} =
    useSetContentLabelMutation()

  const onChangeVisibility = React.useCallback(
    async (values: string[]) => {
      try {
        await setContentLabelPref({
          labelGroup,
          visibility: values[0] as LabelPreference,
        })
      } catch (e) {
        console.error(e)
      }
    },
    [labelGroup, setContentLabelPref],
  )

  const value =
    optimisticContentLabel?.visibility ??
    preferences.moderationOpts.labelGroups[labelGroup]

  const labelOptions = {
    hide: _(msg`Hide`),
    warn: _(msg`Warn`),
    show: _(msg`Show`),
  }

  return (
    <View style={[]}>
      <View
        style={[
          a.py_md,
          a.flex_row,
          a.justify_between,
          a.gap_sm,
          a.align_center,
        ]}>
        <View style={[a.gap_xs, {width: '50%'}]}>
          <Text style={[a.text_md, a.font_bold, t.atoms.text_contrast_medium]}>
            {name}
          </Text>
          <Text style={[a.leading_tight, {maxWidth: 400}]}>{description}</Text>
        </View>

        <View>
          <ToggleButton.Group
            label={_(
              msg`Configure content filtering setting for category: ${name.toLowerCase()}`,
            )}
            values={[value]}
            onChange={onChangeVisibility}>
            <ToggleButton.Button name="hide" label={labelOptions.hide}>
              {labelOptions.hide}
            </ToggleButton.Button>
            <ToggleButton.Button name="warn" label={labelOptions.warn}>
              {labelOptions.warn}
            </ToggleButton.Button>
            <ToggleButton.Button name="ignore" label={labelOptions.show}>
              {labelOptions.show}
            </ToggleButton.Button>
          </ToggleButton.Group>
        </View>
      </View>

      {!!mods.length && (
        <View style={[a.flex_row, a.align_start, a.pb_md]}>
          <Button
            label={_(
              msg`Configure moderation services for category: ${name.toLowerCase()}`,
            )}
            onPress={() =>
              openModSettingsDialog({
                labelGroup,
                modservices: mods,
              })
            }
            style={[a.flex_1]}>
            {ctx => (
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.align_center,
                  a.gap_xs,
                  a.p_sm,
                  a.border,
                  a.rounded_sm,
                  t.atoms.border_contrast_low,
                  (ctx.hovered || ctx.focused) && t.atoms.bg_contrast_25,
                ]}>
                {mods.map(mod => {
                  const modservicePreferences =
                    preferences.moderationOpts.mods.find(
                      ({did}) => did === mod.creator.did,
                    )
                  const enabled =
                    !modservicePreferences?.disabledLabelGroups?.includes(
                      labelGroup,
                    )
                  return (
                    <View
                      key={mod.creator.did}
                      style={[
                        a.py_xs,
                        a.px_sm,
                        a.rounded_sm,
                        a.border,
                        t.atoms.border_contrast_low,
                        enabled && t.atoms.bg_contrast_800,
                      ]}>
                      <Text
                        style={[
                          a.text_xs,
                          a.font_bold,
                          t.atoms.text_contrast_high,
                          enabled && t.atoms.text_inverted,
                        ]}>
                        {getModerationServiceTitle({
                          displayName: mod.creator.displayName,
                          handle: mod.creator.handle,
                        })}
                      </Text>
                    </View>
                  )
                })}

                <Text
                  style={[
                    a.text_xs,
                    a.font_bold,
                    a.pl_sm,
                    a.italic,
                    t.atoms.text_contrast_low,
                  ]}>
                  Configure
                </Text>
              </View>
            )}
          </Button>
        </View>
      )}
    </View>
  )
}

function PwiOptOut() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const updateProfile = useProfileUpdateMutation()

  const isOptedOut =
    profile?.labels?.some(l => l.val === '!no-unauthenticated') || false
  const canToggle = profile && !updateProfile.isPending

  const onToggleOptOut = React.useCallback(() => {
    if (!profile) {
      return
    }
    let wasAdded = false
    updateProfile.mutate({
      profile,
      updates: existing => {
        // create labels attr if needed
        existing.labels = ComAtprotoLabelDefs.isSelfLabels(existing.labels)
          ? existing.labels
          : {
              $type: 'com.atproto.label.defs#selfLabels',
              values: [],
            }

        // toggle the label
        const hasLabel = existing.labels.values.some(
          l => l.val === '!no-unauthenticated',
        )
        if (hasLabel) {
          wasAdded = false
          existing.labels.values = existing.labels.values.filter(
            l => l.val !== '!no-unauthenticated',
          )
        } else {
          wasAdded = true
          existing.labels.values.push({val: '!no-unauthenticated'})
        }

        // delete if no longer needed
        if (existing.labels.values.length === 0) {
          delete existing.labels
        }
        return existing
      },
      checkCommitted: res => {
        const exists = !!res.data.labels?.some(
          l => l.val === '!no-unauthenticated',
        )
        return exists === wasAdded
      },
    })
  }, [updateProfile, profile])

  return (
    <View style={[a.pt_sm, a.px_lg]}>
      <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_lg]}>
        <Toggle.Item
          disabled={!canToggle}
          value={isOptedOut}
          onChange={onToggleOptOut}
          name="logged_out_visibility"
          label={_(
            msg`Discourage apps from showing my account to logged-out users`,
          )}>
          <Toggle.Switch />
          <Toggle.Label style={[a.text_md]}>
            Discourage apps from showing my account to logged-out users
          </Toggle.Label>
        </Toggle.Item>

        {updateProfile.isPending && <Loader />}
      </View>

      <View style={[a.pt_md, a.gap_md, {paddingLeft: 38}]}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            Bluesky will not show your profile and posts to logged-out users.
            Other apps may not honor this request. This does not make your
            account private.
          </Trans>
        </Text>
        <Text style={[a.font_bold, a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            Note: Bluesky is an open and public network. This setting only
            limits the visibility of your content on the Bluesky app and
            website, and other apps may not respect this setting. Your content
            may still be shown to logged-out users by other apps and websites.
          </Trans>
        </Text>

        <InlineLink to="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy">
          <Trans>Learn more about what is public on Bluesky.</Trans>
        </InlineLink>
      </View>
    </View>
  )
}

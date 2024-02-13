import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {ComAtprotoLabelDefs} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  LABEL_GROUPS,
  LabelGroupDefinition,
  DEFAULT_LABEL_GROUP_SETTINGS,
} from '@atproto/api'

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

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {Divider} from '#/components/Divider'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Text} from '#/components/Typography'
import * as Toggle from '#/components/forms/Toggle'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {InlineLink, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'
import * as Dialog from '#/components/Dialog'
import {Button} from '#/components/Button'

function ModSettingsToggleItem({name}: {name: string}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()
  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.justify_between,
        a.align_center,
        a.p_md,
        a.rounded_sm,
        t.atoms.bg_contrast_25,
        {
          backgroundColor: ctx.selected ? t.palette.primary_25 : undefined,
        },
      ]}>
      <Text>{name}</Text>
      {ctx.selected && <Check />}
    </View>
  )
}

function ModSettingsDialog({
  name,
  onComplete,
}: {
  name: string
  onComplete: () => void
}) {
  const t = useTheme()
  const labelGroupStrings = useLabelGroupStrings()
  const [selectedServices, setSelectedServices] = React.useState<string[]>([
    'bluesky',
  ])

  const save = React.useCallback(() => {
    onComplete()
  }, [onComplete])

  return (
    <Dialog.Inner label="Configure moderation service settings">
      <Text style={[a.text_xl, a.font_bold, a.pb_sm]}>
        Configure moderation services
      </Text>
      <Text
        style={[
          a.text_md,
          a.leading_snug,
          t.atoms.text_contrast_high,
          a.pb_lg,
        ]}>
        Select which moderation services' labels you'd like to use to filter
        content matching {labelGroupStrings[name].name}.
      </Text>

      <Toggle.Group
        values={selectedServices}
        onChange={setSelectedServices}
        label="Select one or more">
        <View style={[a.w_full, a.gap_md]}>
          <Toggle.Item name="bluesky" label="Bluesky">
            <ModSettingsToggleItem name="Bluesky" />
          </Toggle.Item>
          <Toggle.Item name="contraption" label="Contraption">
            <ModSettingsToggleItem name="Contraption" />
          </Toggle.Item>
          <Toggle.Item name="safety" label="Safety Corp">
            <ModSettingsToggleItem name="Safety Corp" />
          </Toggle.Item>
        </View>
      </Toggle.Group>

      <View style={[a.flex_row, a.justify_end, a.pt_lg]}>
        <Button
          size="large"
          variant="solid"
          color="primary"
          label="Save"
          onPress={save}>
          {selectedServices.length ? 'Save' : 'Ignore all'}
        </Button>
      </View>
    </Dialog.Inner>
  )
}

export function ModerationScreen({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Moderation'
>) {
  const t = useTheme()
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {gtMobile, gtTablet} = useBreakpoints()
  const labelGroupStrings = useLabelGroupStrings()
  const modSettingsDialogControl = Dialog.useDialogControl()
  const [modSettingsDialogLabelGroup, setModSettingsDialogLabelGroup] =
    React.useState<string>(() => Object.keys(LABEL_GROUPS)[0])

  useFocusEffect(
    React.useCallback(() => {
      screen('Moderation')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  const groups = React.useMemo<
    [keyof typeof LABEL_GROUPS, LabelGroupDefinition][]
  >(() => {
    return Object.entries(LABEL_GROUPS).filter(([, def]) => def.configurable)
  }, [])
  const labelOptions = {
    hide: _(msg`Hide`),
    warn: _(msg`Warn`),
    show: _(msg`Show`),
  }

  const openModSettingsDialog = React.useCallback(
    ({name}: {name: string}) => {
      setModSettingsDialogLabelGroup(name)
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

        <ModSettingsDialog
          name={modSettingsDialogLabelGroup}
          onComplete={() => modSettingsDialogControl.close()}
        />
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

          {groups.map(([name, def], i) => {
            const groupStrings = labelGroupStrings[name]
            return (
              <React.Fragment key={def.id}>
                {i !== 0 && <Divider />}

                <View style={[a.pb_md]}>
                  <View
                    style={[
                      a.py_md,
                      a.flex_row,
                      a.justify_between,
                      a.gap_sm,
                      a.align_center,
                    ]}>
                    <View style={[a.gap_xs, {width: '50%'}]}>
                      <Text
                        style={[
                          a.text_md,
                          a.font_bold,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {groupStrings.name}
                      </Text>
                      <Text style={[a.leading_tight, {maxWidth: 400}]}>
                        {groupStrings.description}
                      </Text>
                    </View>

                    <View>
                      <ToggleButton.Group
                        label={_(
                          msg`Configure content filtering setting for category: ${groupStrings.name.toLowerCase()}`,
                        )}
                        values={[DEFAULT_LABEL_GROUP_SETTINGS[name]]}
                        onChange={() => {}}>
                        <ToggleButton.Button
                          name="hide"
                          label={labelOptions.hide}>
                          {labelOptions.hide}
                        </ToggleButton.Button>
                        <ToggleButton.Button
                          name="warn"
                          label={labelOptions.warn}>
                          {labelOptions.warn}
                        </ToggleButton.Button>
                        <ToggleButton.Button
                          name="ignore"
                          label={labelOptions.show}>
                          {labelOptions.show}
                        </ToggleButton.Button>
                      </ToggleButton.Group>
                    </View>
                  </View>

                  <View style={[a.flex_row, a.align_start]}>
                    <Button
                      label={_(
                        msg`Configure moderation services for category: ${groupStrings.name.toLowerCase()}`,
                      )}
                      onPress={() =>
                        openModSettingsDialog({
                          name,
                        })
                      }>
                      <View style={[a.flex_row, a.align_start, a.gap_xs]}>
                        <View
                          style={[
                            a.py_sm,
                            a.px_md,
                            a.rounded_full,
                            t.atoms.bg_contrast_800,
                          ]}>
                          <Text
                            style={[
                              a.text_xs,
                              a.font_bold,
                              t.atoms.text_inverted,
                            ]}>
                            Bluesky
                          </Text>
                        </View>
                        <View
                          style={[
                            a.py_sm,
                            a.px_md,
                            a.rounded_full,
                            t.atoms.bg_contrast_25,
                          ]}>
                          <Text style={[a.text_xs, a.font_bold]}>
                            Contraption
                          </Text>
                        </View>
                        <View
                          style={[
                            a.py_sm,
                            a.px_md,
                            a.rounded_full,
                            t.atoms.bg_contrast_25,
                          ]}>
                          <Text style={[a.text_xs, a.font_bold]}>
                            Safety Corp
                          </Text>
                        </View>
                      </View>
                    </Button>
                  </View>
                </View>
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

import React from 'react'
import {View} from 'react-native'
import {AppBskyModerationDefs} from '@atproto/api'
import {LabelGroupDefinition} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import * as Toggle from '#/components/forms/Toggle'
import {useLabelGroupStrings} from '#/lib/moderation/useLabelGroupStrings'
import * as Dialog from '#/components/Dialog'
import * as ModerationServiceCard from '#/components/ModerationServiceCard'
import {getModerationServiceTitle} from '#/lib/moderation'
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {useModServiceLabelGroupEnableMutation} from '#/state/queries/modservice'
import {Divider} from '#/components/Divider'
import {InlineLink} from '#/components/Link'
import {useDialogStateControlContext} from '#/state/dialogs'
import {logger} from '#/logger'

function LabelerToggle({
  labelGroup,
  labeler,
  preferences,
}: {
  labelGroup: LabelGroupDefinition['id']
  labeler: AppBskyModerationDefs.ModServiceViewDetailed
  preferences: UsePreferencesQueryResponse
}) {
  const t = useTheme()
  const {
    mutateAsync: toggleGroupEnabled,
    variables: optimisticToggleGroupEnabled,
  } = useModServiceLabelGroupEnableMutation()
  const {closeAllDialogs} = useDialogStateControlContext()

  const labelerPrefs = React.useMemo(
    () =>
      preferences.moderationOpts.mods.find(
        ({did}) => did === labeler.creator.did,
      ),
    [preferences.moderationOpts.mods, labeler.creator.did],
  )
  const isLabelerEnabled = !!labelerPrefs?.enabled
  const isEnabled = isLabelerEnabled
    ? optimisticToggleGroupEnabled?.enabled ??
      !labelerPrefs?.disabledLabelGroups?.includes(labelGroup)
    : false
  const title = getModerationServiceTitle({
    displayName: labeler.creator.displayName,
    handle: labeler.creator.handle,
  })

  const onToggleEnabled = React.useCallback(async () => {
    try {
      if (!labelerPrefs) throw new Error(`labelerPrefs not found`)

      await toggleGroupEnabled({
        did: labelerPrefs.did,
        group: labelGroup,
        enabled: !isEnabled,
      })
    } catch (e: any) {
      logger.error(`Failed to toggle label group enabled`, {
        message: e.message,
        labelGroup,
      })
    }
  }, [toggleGroupEnabled, isEnabled, labelerPrefs, labelGroup])

  return (
    <View style={[a.rounded_sm, a.border, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.justify_between, a.p_md]}>
        <View style={[a.flex_row, a.align_center, a.gap_md]}>
          <ModerationServiceCard.Card.Avatar avatar={labeler.creator.avatar} />
          <View>
            <ModerationServiceCard.Card.Title value={title} />
            <ModerationServiceCard.Card.Description
              value={labeler.description}
              handle={labeler.creator.handle}
            />
          </View>
        </View>

        <Toggle.Item
          disabled={!isLabelerEnabled}
          name={labeler.creator.did}
          label={title}
          key={labeler.creator.did}
          value={isEnabled}
          onChange={onToggleEnabled}>
          <Toggle.Label>{isEnabled ? 'Enabled' : 'Disabled'}</Toggle.Label>
          <Toggle.Switch />
        </Toggle.Item>
      </View>

      <Divider />

      <View style={[a.flex_row, a.p_md]}>
        <Text style={[a.text_xs]}>
          Configure more settings for this labeler{' '}
          <InlineLink
            to={{
              screen: 'ProfileModservice',
              params: {
                name: labeler.creator.handle,
              },
            }}
            style={[a.text_xs]}
            onPress={closeAllDialogs}>
            here.
          </InlineLink>
        </Text>
      </View>
    </View>
  )
}

export type SettingsDialogProps = {
  labelGroup: LabelGroupDefinition['id']
  modservices: AppBskyModerationDefs.ModServiceViewDetailed[]
}

export function SettingsDialog({
  labelGroup,
  modservices,
  preferences,
}: SettingsDialogProps & {
  preferences: UsePreferencesQueryResponse
}) {
  const t = useTheme()
  const labelGroupStrings = useLabelGroupStrings()
  const groupInfoStrings = labelGroupStrings[labelGroup]

  // this is mounted on native
  if (!groupInfoStrings) return null

  return (
    <Dialog.ScrollableInner label="Configure moderation service settings">
      <Dialog.Close />

      <Text style={[a.text_xl, a.font_bold, a.pb_xl]}>
        <Trans>Configure enabled labelers</Trans>
      </Text>

      <View
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.justify_between,
          a.gap_lg,
          a.p_md,
          a.rounded_md,
          a.mb_xl,
          t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <Text style={[a.font_bold]}>{groupInfoStrings.name}</Text>
          <Text style={[a.leading_tight, {maxWidth: 400}]}>
            {groupInfoStrings.description}
          </Text>
        </View>
      </View>

      <Text
        style={[
          a.leading_snug,
          a.font_bold,
          t.atoms.text_contrast_medium,
          a.pb_lg,
        ]}>
        <Trans>Select which labelers to use for this type of content:</Trans>
      </Text>

      <View style={[a.w_full, a.gap_md]}>
        {modservices.map(modservice => {
          return (
            <LabelerToggle
              key={modservice.creator.did}
              labelGroup={labelGroup}
              labeler={modservice}
              preferences={preferences}
            />
          )
        })}
      </View>
    </Dialog.ScrollableInner>
  )
}

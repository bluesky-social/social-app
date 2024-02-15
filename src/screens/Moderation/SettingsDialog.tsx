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
  const {mutateAsync, variables} = useModServiceLabelGroupEnableMutation()

  const modservicePreferences = preferences.moderationOpts.mods.find(
    ({did}) => did === labeler.creator.did,
  )
  const enabled =
    variables?.enabled ??
    !modservicePreferences?.disabledLabelGroups?.includes(labelGroup)
  const title = getModerationServiceTitle({
    displayName: labeler.creator.displayName,
    handle: labeler.creator.handle,
  })

  const onToggleEnabled = React.useCallback(async () => {
    try {
      await mutateAsync({
        // @ts-ignore TODO
        did: modservicePreferences?.did,
        group: labelGroup,
        enabled: !enabled,
      })
    } catch (e: any) {
      // TODO
      console.error(e)
    }
  }, [mutateAsync, enabled, modservicePreferences, labelGroup])
  return (
    <Toggle.Item
      name={labeler.creator.did}
      label={title}
      key={labeler.creator.did}
      value={enabled}
      onChange={onToggleEnabled}>
      {ctx => (
        <ModerationServiceCard.Card.Outer
          style={[
            ...(ctx.focused || ctx.hovered ? [t.atoms.bg_contrast_50] : []),
            ctx.selected && {
              backgroundColor: t.palette.primary_50,
              borderColor: t.palette.primary_100,
            },
          ]}>
          <ModerationServiceCard.Card.Avatar avatar={labeler.creator.avatar} />
          <ModerationServiceCard.Card.Content
            title={title}
            description={labeler.description}
            handle={labeler.creator.handle}
          />
        </ModerationServiceCard.Card.Outer>
      )}
    </Toggle.Item>
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
          a.border,
          t.atoms.border_contrast_low,
        ]}>
        <View style={[a.flex_1, a.gap_xs]}>
          <Text style={[a.text_md, a.font_bold]}>{groupInfoStrings.name}</Text>
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

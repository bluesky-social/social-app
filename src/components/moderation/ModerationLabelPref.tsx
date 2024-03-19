import React from 'react'
import {View} from 'react-native'
import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
import {useLabelBehaviorDescription} from '#/lib/moderation/useLabelBehaviorDescription'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'
import {getLabelStrings} from '#/lib/moderation/useLabelInfo'

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import {InlineLink} from '#/components/Link'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '../icons/CircleInfo'
import * as ToggleButton from '#/components/forms/ToggleButton'

export function ModerationLabelPref({
  labelValueDefinition,
  labelerDid,
  disabled,
}: {
  labelValueDefinition: InterpretedLabelValueDefinition
  labelerDid: string | undefined
  disabled?: boolean
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {gtPhone} = useBreakpoints()

  const isGlobalLabel = !labelValueDefinition.definedBy
  const {identifier} = labelValueDefinition
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const savedPref =
    labelerDid && !isGlobalLabel
      ? preferences?.moderationPrefs.labelers.find(l => l.did === labelerDid)
          ?.labels[identifier]
      : preferences?.moderationPrefs.labels[identifier]
  const pref =
    variables?.visibility ??
    savedPref ??
    labelValueDefinition.defaultSetting ??
    'warn'

  // does the 'warn' setting make sense for this label?
  const canWarn = !(
    labelValueDefinition.blurs === 'none' &&
    labelValueDefinition.severity === 'none'
  )
  // is this label adult only?
  const adultOnly = labelValueDefinition.flags.includes('adult')
  // is this label disabled because it's adult only?
  const adultDisabled =
    adultOnly && !preferences?.moderationPrefs.adultContentEnabled
  // are there any reasons we cant configure this label here?
  const cantConfigure = isGlobalLabel || adultDisabled
  const showConfig = !disabled && (gtPhone || !cantConfigure)

  // adjust the pref based on whether warn is available
  let prefAdjusted = pref
  if (adultDisabled) {
    prefAdjusted = 'hide'
  } else if (!canWarn && pref === 'warn') {
    prefAdjusted = 'ignore'
  }

  // grab localized descriptions of the label and its settings
  const currentPrefLabel = useLabelBehaviorDescription(
    labelValueDefinition,
    prefAdjusted,
  )
  const hideLabel = useLabelBehaviorDescription(labelValueDefinition, 'hide')
  const warnLabel = useLabelBehaviorDescription(labelValueDefinition, 'warn')
  const ignoreLabel = useLabelBehaviorDescription(
    labelValueDefinition,
    'ignore',
  )
  const globalLabelStrings = useGlobalLabelStrings()
  const labelStrings = getLabelStrings(
    i18n.locale,
    globalLabelStrings,
    labelValueDefinition,
  )

  return (
    <View
      style={[
        a.flex_row,
        a.gap_md,
        a.px_lg,
        a.py_lg,
        a.justify_between,
        a.flex_wrap,
      ]}>
      <View style={[a.gap_xs, a.flex_1]}>
        <Text style={[a.font_bold, gtPhone ? a.text_sm : a.text_md]}>
          {labelStrings.name}
        </Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {labelStrings.description}
        </Text>

        {cantConfigure && (
          <View style={[a.flex_row, a.gap_xs, a.align_center, a.mt_xs]}>
            <CircleInfo size="sm" fill={t.atoms.text_contrast_high.color} />

            <Text
              style={[t.atoms.text_contrast_medium, a.font_semibold, a.italic]}>
              {adultDisabled ? (
                <Trans>Adult content is disabled.</Trans>
              ) : isGlobalLabel ? (
                <Trans>
                  Configured in{' '}
                  <InlineLink to="/moderation" style={a.text_sm}>
                    moderation settings
                  </InlineLink>
                  .
                </Trans>
              ) : null}
            </Text>
          </View>
        )}
      </View>

      {showConfig && (
        <View style={[gtPhone ? undefined : a.w_full]}>
          {cantConfigure ? (
            <View
              style={[
                {minHeight: 35},
                a.px_md,
                a.py_md,
                a.rounded_sm,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.font_bold, t.atoms.text_contrast_low]}>
                {currentPrefLabel}
              </Text>
            </View>
          ) : (
            <View style={[{minHeight: 35}]}>
              <ToggleButton.Group
                label={_(
                  msg`Configure content filtering setting for category: ${labelStrings.name.toLowerCase()}`,
                )}
                values={[prefAdjusted]}
                onChange={newPref =>
                  mutate({
                    label: identifier,
                    visibility: newPref[0] as LabelPreference,
                    labelerDid,
                  })
                }>
                <ToggleButton.Button name="ignore" label={ignoreLabel}>
                  {ignoreLabel}
                </ToggleButton.Button>
                {canWarn && (
                  <ToggleButton.Button name="warn" label={warnLabel}>
                    {warnLabel}
                  </ToggleButton.Button>
                )}
                <ToggleButton.Button name="hide" label={hideLabel}>
                  {hideLabel}
                </ToggleButton.Button>
              </ToggleButton.Group>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

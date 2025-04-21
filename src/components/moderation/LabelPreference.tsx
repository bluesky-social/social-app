import React from 'react'
import {View} from 'react-native'
import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
import {useLabelBehaviorDescription} from '#/lib/moderation/useLabelBehaviorDescription'
import {getLabelStrings} from '#/lib/moderation/useLabelInfo'
import {
  usePreferencesQuery,
  usePreferencesSetContentLabelMutation,
} from '#/state/queries/preferences'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '../icons/CircleInfo'

export function Outer({children}: React.PropsWithChildren<{}>) {
  return (
    <View
      style={[
        a.flex_row,
        a.gap_sm,
        a.px_lg,
        a.py_lg,
        a.justify_between,
        a.flex_wrap,
      ]}>
      {children}
    </View>
  )
}

export function Content({
  children,
  name,
  description,
}: React.PropsWithChildren<{
  name: string
  description: string
}>) {
  const t = useTheme()
  const {gtPhone} = useBreakpoints()

  return (
    <View style={[a.gap_xs, a.flex_1]}>
      <Text emoji style={[a.font_bold, gtPhone ? a.text_sm : a.text_md]}>
        {name}
      </Text>
      <Text emoji style={[t.atoms.text_contrast_medium, a.leading_snug]}>
        {description}
      </Text>

      {children}
    </View>
  )
}

export function Buttons({
  name,
  values,
  onChange,
  ignoreLabel,
  warnLabel,
  hideLabel,
}: {
  name: string
  values: ToggleButton.GroupProps['values']
  onChange: ToggleButton.GroupProps['onChange']
  ignoreLabel?: string
  warnLabel?: string
  hideLabel?: string
}) {
  const {_} = useLingui()

  return (
    <View style={[{minHeight: 35}, a.w_full]}>
      <ToggleButton.Group
        label={_(
          msg`Configure content filtering setting for category: ${name}`,
        )}
        values={values}
        onChange={onChange}>
        {ignoreLabel && (
          <ToggleButton.Button name="ignore" label={ignoreLabel}>
            <ToggleButton.ButtonText>{ignoreLabel}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        )}
        {warnLabel && (
          <ToggleButton.Button name="warn" label={warnLabel}>
            <ToggleButton.ButtonText>{warnLabel}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        )}
        {hideLabel && (
          <ToggleButton.Button name="hide" label={hideLabel}>
            <ToggleButton.ButtonText>{hideLabel}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        )}
      </ToggleButton.Group>
    </View>
  )
}

/**
 * For use on the global Moderation screen to set prefs for a "global" label,
 * not scoped to a single labeler.
 */
export function GlobalLabelPreference({
  labelDefinition,
  disabled,
}: {
  labelDefinition: InterpretedLabelValueDefinition
  disabled?: boolean
}) {
  const {_} = useLingui()

  const {identifier} = labelDefinition
  const {data: preferences} = usePreferencesQuery()
  const {mutate, variables} = usePreferencesSetContentLabelMutation()
  const savedPref = preferences?.moderationPrefs.labels[identifier]
  const pref = variables?.visibility ?? savedPref ?? 'warn'

  const allLabelStrings = useGlobalLabelStrings()
  const labelStrings =
    labelDefinition.identifier in allLabelStrings
      ? allLabelStrings[labelDefinition.identifier]
      : {
          name: labelDefinition.identifier,
          description: `Labeled "${labelDefinition.identifier}"`,
        }

  const labelOptions = {
    hide: _(msg`Hide`),
    warn: _(msg`Warn`),
    ignore: _(msg`Show`),
  }

  return (
    <Outer>
      <Content
        name={labelStrings.name}
        description={labelStrings.description}
      />
      {!disabled && (
        <Buttons
          name={labelStrings.name.toLowerCase()}
          values={[pref]}
          onChange={values => {
            mutate({
              label: identifier,
              visibility: values[0] as LabelPreference,
              labelerDid: undefined,
            })
          }}
          ignoreLabel={labelOptions.ignore}
          warnLabel={labelOptions.warn}
          hideLabel={labelOptions.hide}
        />
      )}
    </Outer>
  )
}

/**
 * For use on individual labeler pages
 */
export function LabelerLabelPreference({
  labelDefinition,
  disabled,
  labelerDid,
}: {
  labelDefinition: InterpretedLabelValueDefinition
  disabled?: boolean
  labelerDid?: string
}) {
  const {_, i18n} = useLingui()
  const t = useTheme()
  const {gtPhone} = useBreakpoints()

  const isGlobalLabel = !labelDefinition.definedBy
  const {identifier} = labelDefinition
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
    labelDefinition.defaultSetting ??
    'warn'

  // does the 'warn' setting make sense for this label?
  const canWarn = !(
    labelDefinition.blurs === 'none' && labelDefinition.severity === 'none'
  )
  // is this label adult only?
  const adultOnly = labelDefinition.flags.includes('adult')
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
    labelDefinition,
    prefAdjusted,
  )
  const hideLabel = useLabelBehaviorDescription(labelDefinition, 'hide')
  const warnLabel = useLabelBehaviorDescription(labelDefinition, 'warn')
  const ignoreLabel = useLabelBehaviorDescription(labelDefinition, 'ignore')
  const globalLabelStrings = useGlobalLabelStrings()
  const labelStrings = getLabelStrings(
    i18n.locale,
    globalLabelStrings,
    labelDefinition,
  )

  return (
    <Outer>
      <Content name={labelStrings.name} description={labelStrings.description}>
        {cantConfigure && (
          <View style={[a.flex_row, a.gap_xs, a.align_center, a.mt_xs]}>
            <CircleInfo size="sm" fill={t.atoms.text_contrast_high.color} />

            <Text style={[t.atoms.text_contrast_medium, a.font_bold, a.italic]}>
              {adultDisabled ? (
                <Trans>Adult content is disabled.</Trans>
              ) : isGlobalLabel ? (
                <Trans>
                  Configured in{' '}
                  <InlineLinkText
                    label={_(msg`moderation settings`)}
                    to="/moderation"
                    style={a.text_sm}>
                    moderation settings
                  </InlineLinkText>
                  .
                </Trans>
              ) : null}
            </Text>
          </View>
        )}
      </Content>

      {showConfig && (
        <>
          {cantConfigure ? (
            <View
              style={[
                {minHeight: 35},
                a.px_md,
                a.py_md,
                a.rounded_sm,
                a.border,
                t.atoms.border_contrast_low,
                a.self_start,
              ]}>
              <Text emoji style={[a.font_bold, t.atoms.text_contrast_low]}>
                {currentPrefLabel}
              </Text>
            </View>
          ) : (
            <Buttons
              name={labelStrings.name.toLowerCase()}
              values={[pref]}
              onChange={values => {
                mutate({
                  label: identifier,
                  visibility: values[0] as LabelPreference,
                  labelerDid,
                })
              }}
              ignoreLabel={ignoreLabel}
              warnLabel={canWarn ? warnLabel : undefined}
              hideLabel={hideLabel}
            />
          )}
        </>
      )}
    </Outer>
  )
}

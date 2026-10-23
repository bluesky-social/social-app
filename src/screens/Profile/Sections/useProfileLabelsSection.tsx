import {useMemo} from 'react'
import {View} from 'react-native'
import {
  type InterpretedLabelValueDefinition,
  interpretLabelValueDefinitions,
  type ModerationOpts,
} from '@bsky/sdk/moderation'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {isLabelerSubscribed, lookupLabelValueDefinition} from '#/lib/moderation'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {LabelerLabelPreference} from '#/components/moderation/LabelPreference'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'
import {ErrorState} from '../ErrorState'
import {type ProfileSection} from './types'

const INTRO_ROW = {_reactKey: '__labeler_intro__'}

type LabelRow = typeof INTRO_ROW | InterpretedLabelValueDefinition

/**
 * What a labeler says it labels, and the reader's settings for each one.
 *
 * A labeler's profile has no posts, so this is what its tab strip opens on. The
 * rows are preferences rather than content: nothing here pages or refreshes.
 */
export function useProfileLabelsSection({
  isLabelerLoading,
  labelerInfo,
  labelerError,
  moderationOpts,
}: {
  isLabelerLoading: boolean
  labelerInfo: app.bsky.labeler.defs.LabelerViewDetailed | undefined
  labelerError: Error | null
  moderationOpts: ModerationOpts
}): ProfileSection {
  const t = useTheme()

  const isSubscribed = labelerInfo
    ? !!isLabelerSubscribed(labelerInfo, moderationOpts)
    : false

  const labelValues = useMemo(() => {
    if (isLabelerLoading || !labelerInfo || labelerError) return []
    const customDefs = interpretLabelValueDefinitions(labelerInfo)
    return labelerInfo.policies.labelValues
      .filter((val, i, arr) => arr.indexOf(val) === i) // dedupe
      .map(val => lookupLabelValueDefinition(val, customDefs))
      .filter(
        def => def && def?.configurable,
      ) as InterpretedLabelValueDefinition[]
  }, [labelerInfo, labelerError, isLabelerLoading])

  const rows: LabelRow[] = [INTRO_ROW, ...labelValues]

  return {
    data: rows,
    keyExtractor: (row: LabelRow) =>
      'identifier' in row ? row.identifier : row._reactKey,
    isEmpty: false,
    refreshing: false,
    renderItem: ({item}) => {
      if (!labelerInfo) return null
      if (item === INTRO_ROW) {
        return (
          <View style={a.px_xl}>
            <LabelerListHeader
              isLabelerLoading={isLabelerLoading}
              labelerInfo={labelerInfo}
              labelerError={labelerError}
              hasValues={labelValues.length !== 0}
              isSubscribed={isSubscribed}
            />
          </View>
        )
      }
      const index = labelValues.indexOf(item)
      const isFirst = index === 0
      const isLast = index === labelValues.length - 1
      return (
        <View style={a.px_xl}>
          <View
            style={[
              t.atoms.bg_contrast_25,
              isFirst && [
                a.overflow_hidden,
                {
                  borderTopLeftRadius: tokens.borderRadius.md,
                  borderTopRightRadius: tokens.borderRadius.md,
                },
              ],
              isLast && [
                a.overflow_hidden,
                {
                  borderBottomLeftRadius: tokens.borderRadius.md,
                  borderBottomRightRadius: tokens.borderRadius.md,
                },
              ],
            ]}>
            {!isFirst && <Divider />}
            <LabelerLabelPreference
              disabled={isSubscribed ? undefined : true}
              labelDefinition={item}
              labelerDid={labelerInfo.creator.did}
            />
          </View>
        </View>
      )
    },
    ListFooterComponent: (
      <View style={a.px_xl}>
        <ListFooter height={180} style={a.border_transparent} />
      </View>
    ),
  }
}

export function LabelerListHeader({
  isLabelerLoading,
  labelerError,
  labelerInfo,
  hasValues,
  isSubscribed,
}: {
  isLabelerLoading: boolean
  labelerError?: Error | null
  labelerInfo?: app.bsky.labeler.defs.LabelerViewDetailed
  hasValues: boolean
  isSubscribed: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  if (isLabelerLoading) {
    return (
      <View style={[a.w_full, a.align_center, a.py_4xl]}>
        <Loader size="xl" />
      </View>
    )
  }

  if (labelerError || !labelerInfo) {
    return (
      <View style={[a.w_full, a.align_center, a.py_4xl]}>
        <ErrorState
          error={
            labelerError?.toString() ||
            l(msg`Something went wrong, please try again.`)
          }
        />
      </View>
    )
  }

  return (
    <View style={[a.py_xl]}>
      <Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
        <Trans>
          Labels are annotations on users and content. They can be used to hide,
          warn, and categorize the network.
        </Trans>
      </Text>
      {labelerInfo?.creator.viewer?.blocking ? (
        <View style={[a.flex_row, a.gap_sm, a.align_center, a.mt_md]}>
          <CircleInfo size="sm" fill={t.atoms.text_contrast_medium.color} />
          <Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
            <Trans>
              Blocking does not prevent this labeler from placing labels on your
              account.
            </Trans>
          </Text>
        </View>
      ) : null}
      {!hasValues ? (
        <Text
          style={[
            a.pt_xl,
            t.atoms.text_contrast_high,
            a.leading_snug,
            a.text_sm,
          ]}>
          <Trans>
            This labeler hasn't declared what labels it publishes, and may not
            be active.
          </Trans>
        </Text>
      ) : !isSubscribed ? (
        <Text
          style={[
            a.pt_xl,
            t.atoms.text_contrast_high,
            a.leading_snug,
            a.text_sm,
          ]}>
          <Trans>
            Subscribe to @{labelerInfo.creator.handle} to use these labels:
          </Trans>
        </Text>
      ) : null}
    </View>
  )
}

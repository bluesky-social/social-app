import React from 'react'
import {View} from 'react-native'
import {
  AppBskyLabelerDefs,
  ModerationOpts,
  interpretLabelValueDefinitions,
  InterprettedLabelValueDefinition,
} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSafeAreaFrame} from 'react-native-safe-area-context'

import {useLabelerSubscriptionMutation} from '#/state/queries/labeler'
import {logger} from '#/logger'
import {lookupLabelValueDefinition} from '#/lib/moderation'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {Loader} from '#/components/Loader'
import {Divider} from '#/components/Divider'
import {Button, ButtonText} from '#/components/Button'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {ErrorState} from '../ErrorState'
import {ModerationLabelPref} from '#/components/ModerationLabelPref'

export function ProfileLabelsSection({
  isLabelerLoading,
  labelerInfo,
  labelerError,
  moderationOpts,
}: {
  isLabelerLoading: boolean
  labelerInfo: AppBskyLabelerDefs.LabelerViewDetailed | undefined
  labelerError: Error | null
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {height: minHeight} = useSafeAreaFrame()
  return (
    <CenteredView>
      <View
        style={[
          a.border_l,
          a.border_r,
          a.border_t,
          t.atoms.border_contrast_low,
          {
            minHeight,
          },
        ]}>
        {isLabelerLoading ? (
          <View style={[a.w_full, a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : labelerError || !labelerInfo ? (
          <ErrorState
            error={
              labelerError?.toString() ||
              _(msg`Something went wrong, please try again.`)
            }
          />
        ) : (
          <ProfileLabelsSectionInner
            moderationOpts={moderationOpts}
            labelerInfo={labelerInfo}
          />
        )}
      </View>
    </CenteredView>
  )
}

export function ProfileLabelsSectionInner({
  moderationOpts,
  labelerInfo,
}: {
  moderationOpts: ModerationOpts
  labelerInfo: AppBskyLabelerDefs.LabelerViewDetailed
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {labelValues} = labelerInfo.policies
  const isSubscribed = moderationOpts.prefs.mods.find(
    mod => mod.did === labelerInfo.creator.did,
  )
  const labelDefs = React.useMemo(() => {
    const customDefs = interpretLabelValueDefinitions(labelerInfo)
    return labelValues
      .map(val => lookupLabelValueDefinition(val, customDefs))
      .filter(
        def => def && def?.configurable,
      ) as InterprettedLabelValueDefinition[]
  }, [labelerInfo, labelValues])

  return (
    <ScrollView
      scrollEventThrottle={1}
      contentContainerStyle={{
        borderWidth: 0,
        paddingHorizontal: a.px_xl.paddingLeft,
      }}>
      <View style={[a.pt_xl]}>
        <Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
          <Trans>
            Labels are annotations on users and content. They can be used to
            hide, warn, and categorize the network.
          </Trans>
        </Text>
        {labelValues.length === 0 ? (
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
      {labelDefs.length > 0 && (
        <View
          style={[
            a.mt_xl,
            t.atoms.bg_contrast_25,
            a.rounded_md,
            a.border,
            t.atoms.border_contrast_low,
          ]}>
          {labelDefs.map((labelDef, i) => {
            return (
              <React.Fragment key={labelDef.identifier}>
                {i !== 0 && <Divider />}
                <View style={[a.py_lg, a.px_md]}>
                  <ModerationLabelPref
                    disabled={isSubscribed ? undefined : true}
                    labelValueDefinition={labelDef}
                  />
                </View>
              </React.Fragment>
            )
          })}
        </View>
      )}

      <View style={{height: 100}} />
    </ScrollView>
  )
}

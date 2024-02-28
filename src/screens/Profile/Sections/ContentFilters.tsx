import React from 'react'
import {View} from 'react-native'
import {AppBskyModerationDefs, ModerationOpts} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSafeAreaFrame} from 'react-native-safe-area-context'

import {useModServiceSubscriptionMutation} from '#/state/queries/modservice'
import {getLabelGroupsFromLabels} from '#/lib/moderation'
import {logger} from '#/logger'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {Loader} from '#/components/Loader'
import {Divider} from '#/components/Divider'
import {Button, ButtonText} from '#/components/Button'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {ErrorState} from '../ErrorState'
import {ModerationLabelPref} from '#/components/ModerationLabelPref'

export function ProfileContentFiltersSection({
  modServiceQuery,
  moderationOpts,
}: {
  modServiceQuery: {
    data: AppBskyModerationDefs.ModServiceViewDetailed | undefined
    isLoading: boolean
    error: Error | null
  }
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {height: minHeight} = useSafeAreaFrame()
  const {isLoading, error, data: modservice} = modServiceQuery
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
        {isLoading ? (
          <View style={[a.w_full, a.align_center]}>
            <Loader size="xl" />
          </View>
        ) : error || !modservice ? (
          <ErrorState
            error={
              error?.toString() ||
              _(msg`Something went wrong, please try again.`)
            }
          />
        ) : (
          <ProfileContentFiltersSectionInner
            moderationOpts={moderationOpts}
            modservice={modservice}
          />
        )}
      </View>
    </CenteredView>
  )
}

export function ProfileContentFiltersSectionInner({
  moderationOpts,
  modservice,
}: {
  moderationOpts: ModerationOpts
  modservice: AppBskyModerationDefs.ModServiceViewDetailed
}) {
  const {_} = useLingui()
  const t = useTheme()
  const groups = React.useMemo(() => {
    return getLabelGroupsFromLabels(modservice.policies.labelValues).filter(
      def => def.configurable,
    )
  }, [modservice.policies.labelValues])
  const isEnabled = Boolean(
    moderationOpts.mods.find(
      mod => mod.did === modservice.creator.did && mod.enabled,
    ),
  )
  const hasSession = true // TODO

  const {mutateAsync: toggleSubscription, variables} =
    useModServiceSubscriptionMutation()
  const isSubscribed =
    variables?.subscribe ??
    moderationOpts.mods.find(mod => mod.did === modservice.creator.did)

  const onPressSubscribe = React.useCallback(async () => {
    try {
      await toggleSubscription({
        did: modservice.creator.did,
        subscribe: !isSubscribed,
      })
    } catch (e: any) {
      // setSubscriptionError(e.message)
      logger.error(`Failed to subscribe to labeler`, {message: e.message})
    }
  }, [toggleSubscription, isSubscribed, modservice])

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
        {!isSubscribed && (
          <Text
            style={[
              a.pt_xl,
              t.atoms.text_contrast_high,
              a.leading_snug,
              a.text_sm,
            ]}>
            <Trans>
              Subscribe to @{modservice.creator.handle} to use these labels:
            </Trans>
          </Text>
        )}
      </View>
      <View
        style={[
          a.mt_xl,
          t.atoms.bg_contrast_25,
          a.rounded_md,
          a.border,
          t.atoms.border_contrast_low,
        ]}>
        {groups.map((def, i) => {
          return (
            <React.Fragment key={def.id}>
              {i !== 0 && <Divider />}
              <ModerationLabelPref
                disabled={isEnabled ? undefined : true}
                labelGroup={def.id}
              />
            </React.Fragment>
          )
        })}
      </View>

      <View style={{height: 100}} />
    </ScrollView>
  )
}

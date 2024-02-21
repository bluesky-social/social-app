import React from 'react'
import {View} from 'react-native'
import {AppBskyModerationDefs, ModerationOpts} from '@atproto/api'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSafeAreaFrame} from 'react-native-safe-area-context'

import * as Toast from '#/view/com/util/Toast'
import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {Haptics} from '#/lib/haptics'
import {useAnalytics} from '#/lib/analytics/analytics'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {logger} from '#/logger'
import {useModServiceEnableMutation} from '#/state/queries/modservice'
import {useSession} from '#/state/session'
import {useLikeMutation, useUnlikeMutation} from '#/state/queries/like'

import {getLabelGroupsFromLabels} from '#/lib/moderation'

import {useTheme, atoms as a} from '#/alf'
import {Text} from '#/components/Typography'
import {Loader} from '#/components/Loader'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'

import {ErrorState} from '#/screens/ProfileModerationService/ErrorState'
import {PreferenceRow} from '#/screens/ProfileModerationService/PreferenceRow'

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
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const {track} = useAnalytics()
  const {mutateAsync: likeMod, isPending: isLikePending} = useLikeMutation()
  const {mutateAsync: unlikeMod, isPending: isUnlikePending} =
    useUnlikeMutation()
  const {mutateAsync: toggleEnabled, variables: enabledVariables} =
    useModServiceEnableMutation()

  const [likeUri, setLikeUri] = React.useState<string>(
    modservice.viewer?.like || '',
  )
  // TODO error state
  const [_enablementError, setEnablementError] = React.useState<string>('')

  const isLiked = !!likeUri
  const groups = React.useMemo(() => {
    return getLabelGroupsFromLabels(modservice.policies.labelValues).filter(
      def => def.configurable,
    )
  }, [modservice.policies.labelValues])
  const modservicePreferences = React.useMemo(() => {
    return moderationOpts.mods.find(p => p.did === modservice.creator.did)
  }, [modservice.creator.did, moderationOpts.mods])
  const isSubscribed = moderationOpts.mods.find(
    mod => mod.did === modservice.creator.did,
  )
  const isEnabled = Boolean(
    enabledVariables?.enabled ??
      moderationOpts.mods.find(
        mod => mod.did === modservice.creator.did && mod.enabled,
      ),
  )

  useSetTitle(modservice.creator.displayName || modservice.creator.handle)

  const onToggleLiked = React.useCallback(async () => {
    try {
      Haptics.default()

      if (isLiked && likeUri) {
        await unlikeMod({uri: likeUri})
        track('CustomFeed:Unlike')
        setLikeUri('')
      } else {
        const res = await likeMod({uri: modservice.uri, cid: modservice.cid})
        track('CustomFeed:Like')
        setLikeUri(res.uri)
      }
    } catch (e: any) {
      Toast.show(
        _(
          msg`There was an an issue contacting the server, please check your internet connection and try again.`,
        ),
      )
      logger.error(`Failed to toggle labeler like`, {message: e.message})
    }
  }, [likeUri, isLiked, modservice, likeMod, unlikeMod, track, _])

  const onToggleLabelerEnabled = React.useCallback(async () => {
    try {
      await toggleEnabled({
        did: modservice.creator.did,
        enabled: !isEnabled,
      })
    } catch (e: any) {
      setEnablementError(e.message)
      logger.error(`Failed to toggle labeler enabled`, {message: e.message})
    }
  }, [toggleEnabled, isEnabled, modservice.creator.did])

  return (
    <ScrollView
      scrollEventThrottle={1}
      contentContainerStyle={{
        borderWidth: 0,
        paddingHorizontal: a.px_xl.paddingLeft,
      }}>
      {isSubscribed ? (
        <View style={[a.flex_row, a.pr_lg, a.pt_xl]}>
          <View style={[a.gap_sm, a.flex_1]}>
            <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
              Enable or disable labels from this service.
            </Text>
          </View>

          <Toggle.Item
            name="enable"
            value={isEnabled}
            onChange={onToggleLabelerEnabled}
            label={
              isEnabled
                ? _(msg`Disable this moderation service`)
                : _(msg`Enable this moderation service`)
            }>
            <Toggle.Label>{isEnabled ? 'Enabled' : 'Disabled'}</Toggle.Label>
            <Toggle.Switch />
          </Toggle.Item>
        </View>
      ) : (
        <View style={[a.gap_sm, a.pt_xl]}>
          <Text style={[t.atoms.text_contrast_high, a.leading_snug]}>
            This labeler moderates the following types of content.
          </Text>
        </View>
      )}

      <View
        style={[
          a.gap_md,
          a.mt_xl,
          t.atoms.bg_contrast_25,
          a.rounded_md,
          a.border,
          a.py_md,
          t.atoms.border_contrast_low,
        ]}>
        {groups.map((def, i) => {
          return (
            <React.Fragment key={def.id}>
              {i !== 0 && <Divider />}
              <View style={[a.px_lg]}>
                <PreferenceRow
                  disabled={isEnabled ? undefined : true}
                  labelGroup={def.id}
                  modservicePreferences={modservicePreferences}
                />
              </View>
            </React.Fragment>
          )
        })}
      </View>

      <View style={{height: 100}} />
    </ScrollView>
  )
}

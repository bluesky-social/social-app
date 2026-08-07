import {useCallback} from 'react'
import {View} from 'react-native'
import {type $Typed, ComAtprotoLabelDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  useProfileQuery,
  useProfileUpdateMutation,
} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'

const NO_PROMOTE_LABEL = '!no-promote'

export function AlgoVisibilityOptOut() {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const updateProfile = useProfileUpdateMutation()

  const isOptedOut =
    profile?.labels?.some(label => label.val === NO_PROMOTE_LABEL) || false
  const canToggle = profile && !updateProfile.isPending

  const onToggleOptOut = useCallback(() => {
    if (!profile) {
      return
    }
    let wasAdded = false
    updateProfile.mutate({
      profile,
      updates: existing => {
        const labels: $Typed<ComAtprotoLabelDefs.SelfLabels> = bsky.validate(
          existing.labels,
          ComAtprotoLabelDefs.validateSelfLabels,
        )
          ? existing.labels
          : {
              $type: 'com.atproto.label.defs#selfLabels',
              values: [],
            }

        const hasLabel = labels.values.some(
          label => label.val === NO_PROMOTE_LABEL,
        )
        if (hasLabel) {
          labels.values = labels.values.filter(
            label => label.val !== NO_PROMOTE_LABEL,
          )
        } else {
          wasAdded = true
          labels.values.push({val: NO_PROMOTE_LABEL})
        }

        if (labels.values.length === 0) {
          delete existing.labels
        } else {
          existing.labels = labels
        }

        return existing
      },
      checkCommitted: response => {
        const exists = !!response.data.labels?.some(
          label => label.val === NO_PROMOTE_LABEL,
        )
        return exists === wasAdded
      },
    })
  }, [updateProfile, profile])

  return (
    <View style={[a.flex_1, a.gap_sm]}>
      <Toggle.Item
        name="algorithmic_visibility"
        disabled={!canToggle}
        value={isOptedOut}
        onChange={onToggleOptOut}
        label={_(
          msg`Ask apps to hide my posts from algorithmic recommendations`,
        )}
        style={[a.w_full]}>
        <Toggle.LabelText style={[a.flex_1]}>
          <Trans>
            Ask apps to hide my posts from algorithmic recommendations
          </Trans>
        </Toggle.LabelText>
        <Toggle.Platform />
      </Toggle.Item>

      <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
        <Trans>
          Bluesky will not show your posts in algorithmic recommendations and
          will ask other apps to do the same. Your posts may still appear in the
          Discover feed, but only to your followers.
        </Trans>
      </Text>
    </View>
  )
}

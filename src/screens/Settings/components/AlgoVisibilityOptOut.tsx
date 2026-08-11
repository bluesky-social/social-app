import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  useContentVisibilityMutation,
  useContentVisibilityQuery,
} from '#/state/queries/content-visibility'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

export function AlgoVisibilityOptOut() {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const {data, isPending: isQueryPending} = useContentVisibilityQuery()
  const updateContentVisibility = useContentVisibilityMutation()

  const isOptedOut = data?.hideFromAlgorithmicRecommendations ?? false
  const canToggle = !isQueryPending && !updateContentVisibility.isPending

  const onToggleOptOut = (hide: boolean) => {
    ax.metric('contentVisibility:algorithmicRecommendations:change', {hide})
    updateContentVisibility.mutate(hide)
  }

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
          Bluesky will not show your posts in the Discover feed (except to your
          followers) and will ask other apps not to show your posts in their own
          algorithmic recommendations.
        </Trans>
      </Text>
    </View>
  )
}

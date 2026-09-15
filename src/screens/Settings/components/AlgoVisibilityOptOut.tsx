import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  useContentVisibilityMutation,
  useContentVisibilityQuery,
} from '#/state/queries/content-visibility'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

export function AlgoVisibilityOptOut() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {data, isPending: isQueryPending} = useContentVisibilityQuery()
  const updateContentVisibility = useContentVisibilityMutation()

  const isOptedOut = data?.hideFromAlgorithmicRecommendations ?? false
  const canToggle = !isQueryPending && !updateContentVisibility.isPending

  const onToggleOptOut = (hide: boolean) => {
    updateContentVisibility.mutate(hide)
  }

  return (
    <View style={[a.flex_1, a.gap_sm]}>
      <Toggle.Item
        name="algorithmic_visibility"
        disabled={!canToggle}
        value={isOptedOut}
        onChange={onToggleOptOut}
        label={l`Ask apps to hide my posts from algorithmic recommendations`}
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
          On Bluesky, this means your posts will only appear in the Discover
          feed to people who follow you. Other apps can choose to use this
          preference in their own algorithmic recommendations.
        </Trans>
      </Text>
    </View>
  )
}

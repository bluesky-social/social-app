import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function DiscoverFallbackHeader() {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <View style={[a.flex_row, a.py_lg, t.atoms.bg_contrast_25]}>
      <View
        style={[
          {width: 70, paddingLeft: 18, paddingRight: 10},
          a.align_center,
        ]}>
        <CircleInfoIcon width={36} style={t.atoms.text_contrast_medium} />
      </View>
      <View style={[a.flex_1, a.pr_lg]}>
        <Text style={[a.text_md, a.leading_snug]}>
          <Trans>
            We ran out of posts from your follows. Here's the latest from{' '}
            <InlineLinkText
              label={_(msg`Discover`)}
              to="/profile/bsky.app/feed/whats-hot"
              style={[a.text_md, a.leading_snug, a.font_medium]}>
              Discover
            </InlineLinkText>
            .
          </Trans>
        </Text>
      </View>
    </View>
  )
}

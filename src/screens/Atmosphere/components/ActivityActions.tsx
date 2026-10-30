import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Mark as BlueskyIcon} from '#/components/icons/brands/Mark'
import {createSinglePathSVG} from '#/components/icons/TEMPLATE'
import {Link} from '#/components/Link'
import {type ActivityAssociatedPost} from '../activityPost'
import {type ActivityActor} from '../types'
import {ActivityMenu} from './ActivityMenu'

const BlueskyOutlineIcon = createSinglePathSVG({
  path: BlueskyIcon.svgPaths[0],
  viewBox: BlueskyIcon.svgViewBox,
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export function ActivityActions({
  actor,
  post,
}: {
  actor: ActivityActor
  post?: ActivityAssociatedPost
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const icon = (
    <BlueskyOutlineIcon
      size="md"
      fill={
        t.scheme === 'light' ? t.palette.contrast_900 : t.palette.contrast_500
      }
    />
  )

  return (
    <View
      testID="atmosphereActivityActions"
      style={[a.flex_row, a.flex_shrink_0, a.align_center, a.gap_xs]}>
      {post ? (
        <Link
          to={post.href}
          label={l`View post on Bluesky`}
          testID="atmosphereBlueskyPostButton"
          size="tiny"
          shape="round"
          color="secondary"
          style={a.bg_transparent}
          hoverStyle={a.bg_transparent}>
          {icon}
        </Link>
      ) : (
        <Button
          disabled
          label={l`Bluesky post unavailable`}
          testID="atmosphereBlueskyPostButton"
          size="tiny"
          shape="round"
          color="secondary"
          style={a.bg_transparent}
          hoverStyle={a.bg_transparent}>
          {icon}
        </Button>
      )}
      <ActivityMenu actor={actor} post={post} />
    </View>
  )
}

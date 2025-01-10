import {AppBskyFeedDefs, moderateFeedGenerator} from '@atproto/api'

import {ModeratorData} from '../data/getModeratorData.js'
import {PostData} from '../data/getPostData.js'
import {atoms as a, theme as t} from '../theme/index.js'
import {formatCount} from '../util/formatCount.js'
import {getModerationCauseInfo} from '../util/getModerationCauseInfo.js'
import {Box} from './Box.js'
import {Image} from './Image.js'
import {ModeratedEmbed} from './ModeratedEmbed.js'
import {Text} from './Text.js'

export function FeedCard({
  embed,
  data,
  moderatorData,
}: {
  embed: AppBskyFeedDefs.GeneratorView
  data: PostData
  moderatorData: ModeratorData
}) {
  const feedModeration = moderateFeedGenerator(
    embed,
    moderatorData.moderationOptions,
  )
  const modui = feedModeration.ui('contentList')
  const info = getModerationCauseInfo({
    cause: modui.blurs.at(0),
    moderatorData,
  })

  if (info) {
    return <ModeratedEmbed info={info} />
  }

  const {avatar, displayName, likeCount = 0, creator} = embed
  const image = data.images.get(avatar || '')

  return (
    <Box
      cx={[
        a.w_full,
        a.gap_sm,
        a.rounded_sm,
        a.p_md,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <Box cx={[a.flex_row, a.align_center, a.gap_sm]}>
        {image && (
          <Image
            image={image}
            cx={[
              a.rounded_sm,
              {
                width: '40px',
              },
            ]}
          />
        )}
        <Box cx={[a.pt_2xs]}>
          <Text cx={[a.text_md, a.font_bold, a.pb_2xs]}>{displayName}</Text>
          <Text cx={[a.text_sm, a.leading_snug]}>By @{creator.handle}</Text>
        </Box>
      </Box>

      {likeCount > 1 && (
        <Text cx={[a.text_sm, a.leading_snug]}>
          Liked by {formatCount(likeCount)} users
        </Text>
      )}
    </Box>
  )
}

import React from 'react'
import {
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  RichText as RichTextApi,
} from '@atproto/api'

import {ModeratorData} from '../../data/getModeratorData.js'
import {PostData} from '../../data/getPostData.js'
import {atoms as a, theme as t} from '../../theme/index.js'
import {getModerationCauseInfo} from '../../util/getModerationCauseInfo.js'
import {moderatePost} from '../../util/moderatePost.js'
import {viewRecordToPostView} from '../../util/viewRecordToPostView.js'
import {Avatar} from '../Avatar.js'
import {Box} from '../Box.js'
import {CircleInfo} from '../icons/CircleInfo.js'
import {ModeratedEmbed} from '../ModeratedEmbed.js'
import {PostEmbed} from '../PostEmbed.js'
import {RichText} from '../RichText.js'
import {Text} from '../Text.js'

export function QuotePost({
  embed,
  data,
  moderatorData,
}: {
  embed: AppBskyEmbedRecord.ViewRecord
  data: PostData
  moderatorData: ModeratorData
}) {
  const {author, value: post, embeds} = embed
  const avatar = data.images.get(author.avatar || '')
  const rt =
    AppBskyFeedPost.isValidRecord(post) && post.text
      ? new RichTextApi({
          text: post.text,
          facets: post.facets,
        })
      : undefined
  const postView = viewRecordToPostView(embed)
  const moderation = moderatePost(postView, moderatorData.moderationOptions)

  const mod = moderation.ui('contentView')
  const info = getModerationCauseInfo({
    cause: mod.blurs.at(0),
    moderatorData,
  })

  if (info) {
    return <ModeratedEmbed info={info} />
  }

  return (
    <Box
      cx={[
        a.w_full,
        a.p_md,
        a.rounded_sm,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      <Box cx={[a.flex_row, a.align_center, a.gap_xs, a.pb_sm]}>
        <Avatar
          size={20}
          image={avatar}
          profile={author}
          moderatorData={moderatorData}
        />
        <Box cx={[a.flex_row, a.align_center, a.gap_xs]}>
          <Text cx={[a.text_sm, a.font_bold]}>
            {author.displayName || author.handle}
          </Text>
          <Text cx={[a.text_xs, t.atoms.text_contrast_medium]}>
            @{author.handle}
          </Text>
        </Box>
      </Box>

      {rt && <RichText value={rt} cx={[a.text_sm]} />}

      {embeds && embeds.length && (
        <Box cx={[a.pt_sm]}>
          <PostEmbed
            embed={embeds[0]}
            data={data}
            moderation={moderation}
            moderatorData={moderatorData}
            hideNestedEmbeds
          />
        </Box>
      )}
    </Box>
  )
}

export function NotQuotePost({children}: {children: React.ReactNode}) {
  return (
    <Box
      cx={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.rounded_sm,
        a.p_md,
        t.atoms.bg_contrast_25,
      ]}>
      <CircleInfo size={20} fill={t.atoms.text_contrast_low.color} />
      <Text cx={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
        {children}
      </Text>
    </Box>
  )
}

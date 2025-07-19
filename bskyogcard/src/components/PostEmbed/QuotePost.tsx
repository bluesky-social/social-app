import {
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  RichText as RichTextApi,
} from '@atproto/api'

import {ModeratorData} from '../../data/getModeratorData.js'
import {PostData} from '../../data/getPostData.js'
import {atoms as a, theme as t} from '../../theme/index.js'
import * as bsky from '../../types/bsky/index.js'
import {getModerationCauseInfo} from '../../util/getModerationCauseInfo.js'
import {moderatePost} from '../../util/moderatePost.js'
import {sanitizeHandle} from '../../util/sanitizeHandle.js'
import {getVerificationState} from '../../util/verificationState.js'
import {viewRecordToPostView} from '../../util/viewRecordToPostView.js'
import {Avatar} from '../Avatar.js'
import {Box} from '../Box.js'
import {CircleInfo} from '../icons/CircleInfo.js'
import {ModeratedEmbed} from '../ModeratedEmbed.js'
import {PostEmbed} from '../PostEmbed.js'
import {RichText} from '../RichText.js'
import {Text} from '../Text.js'
import {VerificationCheck} from '../VerificationCheck.js'

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
    bsky.dangerousIsType<AppBskyFeedPost.Record>(
      post,
      AppBskyFeedPost.isRecord,
    ) && post.text
      ? new RichTextApi({
          text: post.text,
          facets: post.facets,
        })
      : undefined
  const postView = viewRecordToPostView(embed)
  const moderation = moderatePost(postView, moderatorData.moderationOptions)
  const verification = getVerificationState({profile: embed.author})

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
      <Box
        cx={[
          a.flex_row,
          a.align_center,
          {gap: 6},
          a.pb_xs,
          a.w_full,
          a.overflow_hidden,
        ]}>
        <Avatar
          size={16}
          image={avatar}
          profile={author}
          moderatorData={moderatorData}
        />
        <Box cx={[a.flex_row, a.align_center, a.gap_xs, a.pt_2xs]}>
          <Text
            cx={[
              a.text_sm,
              a.font_bold,
              a.flex_shrink_0,
              {maxWidth: '70%'},
              a.line_clamp_1,
            ]}>
            {author.displayName || author.handle}
          </Text>
          {verification.isVerified && (
            <Box cx={[{marginTop: -2}]}>
              <VerificationCheck
                size={12}
                verifier={verification.role === 'verifier'}
                fill={t.palette.primary_500}
              />
            </Box>
          )}
          <Text
            cx={[
              a.text_xs,
              t.atoms.text_contrast_medium,
              {flexShrink: 10},
              a.line_clamp_1,
            ]}>
            {sanitizeHandle(author.handle, '@')}
          </Text>
        </Box>
      </Box>

      {rt && <RichText value={rt} cx={[a.text_sm]} />}

      {embeds && embeds.length && (
        <PostEmbed
          embed={embeds[0]}
          data={data}
          moderation={moderation}
          moderatorData={moderatorData}
          hideNestedEmbeds
          cx={[a.pt_sm]}
        />
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

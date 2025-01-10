import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  RichText as RichTextApi,
} from '@atproto/api'

import {ModeratorData} from '../data/getModeratorData.js'
import {PostData} from '../data/getPostData.js'
import {atoms as a, gradient, theme as t} from '../theme/index.js'
import {formatCount} from '../util/formatCount.js'
import {formatDate} from '../util/formatDate.js'
import {moderatePost} from '../util/moderatePost.js'
import {Avatar} from './Avatar.js'
import {Box} from './Box.js'
import {Heart} from './icons/Heart.js'
import {Logomark} from './icons/Logomark.js'
import {Logotype} from './icons/Logotype.js'
import {Repost} from './icons/Repost.js'
import {PostEmbed} from './PostEmbed.js'
import {RichText} from './RichText.js'
import {Text} from './Text.js'

export function Post({
  post,
  data,
  moderatorData,
}: {
  post: AppBskyFeedDefs.PostView
  data: PostData
  moderatorData: ModeratorData
}) {
  if (AppBskyFeedPost.isValidRecord(post.record)) {
    const avatar = data.images.get(post.author.avatar)
    const rt = post.record.text
      ? new RichTextApi({
          text: post.record.text,
          facets: post.record.facets,
        })
      : undefined
    const hasInteractions = post.likeCount > 0 || post.repostCount > 0
    const moderation = moderatePost(post, moderatorData.moderationOptions)

    return (
      <Box
        cx={[
          a.flex,
          a.align_center,
          a.w_full,
          a.h_full,
          a.p_3xl,
          {
            backgroundImage: `linear-gradient(to bottom, ${gradient('sky')})`,
          },
        ]}>
        <Box
          cx={[
            a.flex,
            a.flex_col,
            a.w_full,
            a.p_xl,
            a.rounded_md,
            t.atoms.bg,
            {
              boxShadow: `0 0 20px rgb(0, 25, 51, 0.2)`,
            },
          ]}>
          <Box cx={[a.flex_row, a.align_center, a.gap_sm, a.pb_sm]}>
            <Avatar
              size={48}
              image={avatar}
              profile={post.author}
              moderatorData={moderatorData}
            />
            <Box cx={[a.flex_col]}>
              <Text cx={[a.text_md, a.font_bold, a.pb_2xs]}>
                {post.author.displayName || post.author.handle}
              </Text>
              <Text cx={[a.text_sm, t.atoms.text_contrast_medium]}>
                @{post.author.handle}
              </Text>
            </Box>
          </Box>

          {rt && <RichText value={rt} />}

          {post.embed && (
            <Box cx={[a.pt_sm]}>
              <PostEmbed
                embed={post.embed}
                data={data}
                moderation={moderation}
                moderatorData={moderatorData}
              />
            </Box>
          )}

          <Box cx={[a.flex_row, a.align_center, a.justify_between, a.pt_md]}>
            <Text cx={[a.text_sm, t.atoms.text_contrast_medium]}>
              {formatDate(post.record.createdAt)}
            </Text>

            {!hasInteractions && <Logo />}
          </Box>

          {hasInteractions && (
            <Box cx={[a.pt_md]}>
              <Box
                cx={[
                  a.w_full,
                  a.pb_md,
                  a.border_t,
                  t.atoms.border_contrast_low,
                ]}
              />

              <Box cx={[a.flex_row, a.align_center, a.justify_between]}>
                <Box cx={[a.flex_row, a.align_center, a.gap_2xl]}>
                  {post.likeCount > 0 && (
                    <Box cx={[a.flex_row, a.align_center, a.gap_sm]}>
                      <Heart size={22} fill={t.palette.red_400} />
                      <Box
                        cx={[
                          a.text_sm,
                          a.font_bold,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {formatCount(post.likeCount)}
                      </Box>
                    </Box>
                  )}
                  {post.repostCount > 0 && (
                    <Box cx={[a.flex_row, a.align_center, a.gap_sm]}>
                      <Repost size={22} fill={t.palette.green_600} />
                      <Box
                        cx={[
                          a.text_sm,
                          a.font_bold,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {formatCount(post.repostCount)}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Logo />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    )
  }

  return null
}

export function Logo() {
  return (
    <Box cx={[a.flex_row, a.align_center]}>
      <Logomark size={20} fill={t.palette.primary_500} />
      <Box
        cx={[
          {
            paddingTop: '3px',
            paddingLeft: '6px',
          },
        ]}>
        <Logotype size={64} fill={t.palette.contrast_800} />
      </Box>
    </Box>
  )
}

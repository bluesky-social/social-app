import React, {useMemo} from 'react'
import {View} from 'react-native'
import {
  AppBskyEmbedRecord,
  AppBskyFeedPost,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'

import {moderatePost_wrapped as moderatePost} from '#/lib/moderatePost_wrapped'
import {makeProfileLink} from '#/lib/routes/links'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {usePostQuery} from '#/state/queries/post'
import {PostEmbeds} from '#/view/com/util/post-embeds'
import {PostMeta} from '#/view/com/util/PostMeta'
import {atoms as a, useTheme} from '#/alf'
import {Link} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {RichText} from '#/components/RichText'

let MessageItemEmbed = ({
  embed,
}: {
  embed: AppBskyEmbedRecord.Main
}): React.ReactNode => {
  const t = useTheme()
  const {data: post} = usePostQuery(embed.record.uri)

  const moderationOpts = useModerationOpts()
  const moderation = useMemo(
    () =>
      moderationOpts && post ? moderatePost(post, moderationOpts) : undefined,
    [moderationOpts, post],
  )

  const {rt, record} = useMemo(() => {
    if (
      post &&
      AppBskyFeedPost.isRecord(post.record) &&
      AppBskyFeedPost.validateRecord(post.record).success
    ) {
      return {
        rt: new RichTextAPI({
          text: post.record.text,
          facets: post.record.facets,
        }),
        record: post.record,
      }
    }

    return {rt: undefined, record: undefined}
  }, [post])

  if (!post || !moderation || !rt || !record) {
    return null
  }

  const itemUrip = new AtUri(post.uri)
  const itemHref = makeProfileLink(post.author, 'post', itemUrip.rkey)

  return (
    <Link to={itemHref}>
      <View
        style={[
          a.w_full,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          a.rounded_md,
          a.border,
          a.p_md,
          a.my_xs,
        ]}>
        <PostMeta
          showAvatar
          author={post.author}
          moderation={moderation}
          authorHasWarning={!!post.author.labels?.length}
          timestamp={post.indexedAt}
          postHref={itemHref}
        />
        <ContentHider modui={moderation.ui('contentView')}>
          <PostAlerts modui={moderation.ui('contentView')} style={a.py_xs} />
          {rt.text && (
            <View style={a.mt_xs}>
              <RichText
                enableTags
                testID="postText"
                value={rt}
                style={[a.text_sm, t.atoms.text_contrast_high]}
                authorHandle={post.author.handle}
              />
            </View>
          )}
          {post.embed && (
            <PostEmbeds
              embed={post.embed}
              moderation={moderation}
              style={a.mt_xs}
              quoteTextStyle={[a.text_sm, t.atoms.text_contrast_high]}
            />
          )}
        </ContentHider>
      </View>
    </Link>
  )
}
MessageItemEmbed = React.memo(MessageItemEmbed)
export {MessageItemEmbed}

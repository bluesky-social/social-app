import React, {memo, useMemo} from 'react'
import {View} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {usePalette} from '#/lib/hooks/usePalette'
import {makeProfileLink} from '#/lib/routes/links'
import {countLines} from '#/lib/strings/helpers'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {type Slice} from '#/state/queries/usePostThread/types'
import {useSession} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {TextLink} from '#/view/com/util/Link'
import {PostEmbeds, PostEmbedViewContext} from '#/view/com/util/post-embeds'
import {PostMeta} from '#/view/com/util/PostMeta'
import {
  OUTER_SPACE,
  REPLY_LINE_WIDTH,
  TREE_AVI_WIDTH,
  TREE_INDENT,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {PostHider} from '#/components/moderation/PostHider'
import {type AppModerationCause} from '#/components/Pills'
import {PostControls} from '#/components/PostControls'
import {RichText} from '#/components/RichText'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import {Text} from '#/components/Typography'

/**
 * Mimic the space in PostMeta
 */
const TREE_AVI_PLUS_SPACE = TREE_AVI_WIDTH + a.gap_xs.gap

export function ThreadReply({
  item,
  overrides,
  onPostSuccess,
  threadgateRecord,
}: {
  item: Extract<Slice, {type: 'threadPost'}>
  overrides?: {
    moderation?: boolean
    topBorder?: boolean
  }
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const postShadow = usePostShadow(item.value.post)

  if (postShadow === POST_TOMBSTONE) {
    return <PostThreadItemDeleted />
  }

  return (
    <ThreadReplyInner
      // Safeguard from clobbering per-post state below:
      key={postShadow.uri}
      item={item}
      postShadow={postShadow}
      threadgateRecord={threadgateRecord}
      overrides={overrides}
      onPostSuccess={onPostSuccess}
    />
  )
}

function PostThreadItemDeleted({hideTopBorder}: {hideTopBorder?: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.p_xl,
        a.pl_lg,
        a.flex_row,
        a.gap_md,
        !hideTopBorder && a.border_t,
      ]}>
      <TrashIcon style={[t.atoms.text]} />
      <Text style={[t.atoms.text_contrast_medium, a.mt_2xs]}>
        <Trans>This post has been deleted.</Trans>
      </Text>
    </View>
  )
}

const ThreadReplyInner = memo(function ThreadReplyInner({
  item,
  postShadow,
  overrides,
  onPostSuccess,
  threadgateRecord,
}: {
  item: Extract<Slice, {type: 'threadPost'}>
  postShadow: Shadow<AppBskyFeedDefs.PostView>
  overrides?: {
    moderation?: boolean
    topBorder?: boolean
  }
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}): React.ReactNode {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {openComposer} = useOpenComposer()
  const {currentAccount} = useSession()

  const post = item.value.post
  const record = item.value.post.record
  const moderation = item.moderation
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )
  const [limitLines, setLimitLines] = React.useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const threadRootUri = record.reply?.root?.uri || post.uri
  const postHref = React.useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const additionalPostAlerts: AppModerationCause[] = React.useMemo(() => {
    const isPostHiddenByThreadgate = threadgateHiddenReplies.has(post.uri)
    const isControlledByViewer =
      new AtUri(threadRootUri).host === currentAccount?.did
    return isControlledByViewer && isPostHiddenByThreadgate
      ? [
          {
            type: 'reply-hidden',
            source: {type: 'user', did: currentAccount?.did},
            priority: 6,
          },
        ]
      : []
  }, [post, currentAccount?.did, threadgateHiddenReplies, threadRootUri])

  const onPressReply = React.useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation,
      },
      onPostSuccess: onPostSuccess,
    })
  }, [openComposer, post, record, onPostSuccess, moderation])

  const onPressShowMore = React.useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  const indents = Math.max(0, item.ui.indent - 1)

  return (
    <View
      style={[
        a.flex_row,
        item.ui.indent === 1 &&
          !item.ui.showParentReplyLine && [
            a.border_t,
            t.atoms.border_contrast_low,
          ],
      ]}>
      {Array.from(Array(indents)).map((_, n: number) => {
        const isSkipped = item.ui.skippedIndentIndices.has(n)
        return (
          <View
            key={`${post.uri}-padding-${n}`}
            style={[
              t.atoms.border_contrast_low,
              {
                borderRightWidth: isSkipped ? 0 : REPLY_LINE_WIDTH,
                width: TREE_INDENT + TREE_AVI_WIDTH / 2,
                left: 1,
              },
            ]}
          />
        )
      })}
      <View style={a.flex_1}>
        <SubtleHover>
          <View
            style={[
              {
                paddingHorizontal: OUTER_SPACE,
                paddingTop: OUTER_SPACE / 2,
              },
              item.ui.indent === 1 && [
                !item.ui.showParentReplyLine && a.pt_lg,
                !item.ui.showChildReplyLine && a.pb_sm,
              ],
              item.ui.isLastChild &&
                !item.ui.precedesChildReadMore && [a.pb_sm],
            ]}>
            {item.ui.indent > 1 && (
              <View
                style={[
                  a.absolute,
                  t.atoms.border_contrast_low,
                  {
                    left: -1,
                    top: 0,
                    height:
                      TREE_AVI_WIDTH / 2 +
                      REPLY_LINE_WIDTH / 2 +
                      OUTER_SPACE / 2,
                    width: OUTER_SPACE,
                    borderLeftWidth: REPLY_LINE_WIDTH,
                    borderBottomWidth: REPLY_LINE_WIDTH,
                    borderBottomLeftRadius: a.rounded_sm.borderRadius,
                  },
                ]}
              />
            )}
            <PostHider
              testID={`postThreadItem-by-${post.author.handle}`}
              href={postHref}
              disabled={overrides?.moderation === true}
              modui={moderation.ui('contentList')}
              iconSize={42}
              iconStyles={{marginLeft: 2, marginRight: 2}}
              profile={post.author}
              interpretFilterAsBlur>
              <View style={[a.flex_row, a.gap_md]}>
                <View style={[a.flex_1]}>
                  <PostMeta
                    author={post.author}
                    moderation={moderation}
                    timestamp={post.indexedAt}
                    postHref={postHref}
                    avatarSize={TREE_AVI_WIDTH}
                    style={[a.pb_2xs]}
                    showAvatar
                  />
                  <View style={[a.flex_row]}>
                    <View style={[a.relative, {width: TREE_AVI_PLUS_SPACE}]}>
                      {item.ui.showChildReplyLine && (
                        <View
                          style={[
                            a.flex_1,
                            t.atoms.border_contrast_low,
                            {
                              borderRightWidth: 2,
                              width: '50%',
                              left: -1,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={[a.flex_1]}>
                      <LabelsOnMyPost post={post} style={[a.pb_2xs]} />
                      <PostAlerts
                        modui={moderation.ui('contentList')}
                        style={[a.pb_2xs]}
                        additionalCauses={additionalPostAlerts}
                      />
                      {richText?.text ? (
                        <View>
                          <RichText
                            enableTags
                            value={richText}
                            style={[a.flex_1, a.text_md]}
                            numberOfLines={
                              limitLines ? MAX_POST_LINES : undefined
                            }
                            authorHandle={post.author.handle}
                            shouldProxyLinks={true}
                          />
                        </View>
                      ) : undefined}
                      {limitLines ? (
                        <TextLink
                          text={_(msg`Show More`)}
                          style={pal.link}
                          onPress={onPressShowMore}
                          href="#"
                        />
                      ) : undefined}
                      {post.embed && (
                        <View style={[a.pb_xs]}>
                          <PostEmbeds
                            embed={post.embed}
                            moderation={moderation}
                            viewContext={PostEmbedViewContext.Feed}
                          />
                        </View>
                      )}
                      <PostControls
                        post={postShadow}
                        record={record}
                        richText={richText}
                        onPressReply={onPressReply}
                        logContext="PostThreadItem"
                        threadgateRecord={threadgateRecord}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </PostHider>
          </View>
        </SubtleHover>
      </View>
    </View>
  )
})

function SubtleHover({children}: {children: React.ReactNode}) {
  const {
    state: hover,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  return (
    <View
      onPointerEnter={onHoverIn}
      onPointerLeave={onHoverOut}
      style={a.pointer}>
      <SubtleWebHover hover={hover} />
      {children}
    </View>
  )
}

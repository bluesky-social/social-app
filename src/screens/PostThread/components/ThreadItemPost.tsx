import {memo, type ReactNode, useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {useActorStatus} from '#/lib/actor-status'
import {MAX_POST_LINES} from '#/lib/constants'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {makeProfileLink} from '#/lib/routes/links'
import {countLines} from '#/lib/strings/helpers'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {type ThreadItem} from '#/state/queries/usePostThread/types'
import {useSession} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {PostMeta} from '#/view/com/util/PostMeta'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {
  LINEAR_AVI_WIDTH,
  OUTER_SPACE,
  REPLY_LINE_WIDTH,
} from '#/screens/PostThread/const'
import {atoms as a, useTheme} from '#/alf'
import {DebugFieldDisplay} from '#/components/DebugFieldDisplay'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {PostHider} from '#/components/moderation/PostHider'
import {type AppModerationCause} from '#/components/Pills'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {ShowMoreTextButton} from '#/components/Post/ShowMoreTextButton'
import {PostControls, PostControlsSkeleton} from '#/components/PostControls'
import {RichText} from '#/components/RichText'
import * as Skele from '#/components/Skeleton'
import {SubtleHover} from '#/components/SubtleHover'
import {Text} from '#/components/Typography'

export type ThreadItemPostProps = {
  item: Extract<ThreadItem, {type: 'threadPost'}>
  overrides?: {
    moderation?: boolean
    topBorder?: boolean
  }
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}

export function ThreadItemPost({
  item,
  overrides,
  onPostSuccess,
  threadgateRecord,
}: ThreadItemPostProps) {
  const postShadow = usePostShadow(item.value.post)

  if (postShadow === POST_TOMBSTONE) {
    return <ThreadItemPostDeleted item={item} overrides={overrides} />
  }

  return (
    <ThreadItemPostInner
      item={item}
      postShadow={postShadow}
      threadgateRecord={threadgateRecord}
      overrides={overrides}
      onPostSuccess={onPostSuccess}
    />
  )
}

function ThreadItemPostDeleted({
  item,
  overrides,
}: Pick<ThreadItemPostProps, 'item' | 'overrides'>) {
  const t = useTheme()

  return (
    <ThreadItemPostOuterWrapper item={item} overrides={overrides}>
      <ThreadItemPostParentReplyLine item={item} />

      <View
        style={[
          a.flex_row,
          a.align_center,
          a.py_md,
          a.rounded_sm,
          t.atoms.bg_contrast_25,
        ]}>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.justify_center,
            {
              width: LINEAR_AVI_WIDTH,
            },
          ]}>
          <TrashIcon style={[t.atoms.text_contrast_medium]} />
        </View>
        <Text
          style={[a.text_md, a.font_semi_bold, t.atoms.text_contrast_medium]}>
          <Trans>Post has been deleted</Trans>
        </Text>
      </View>

      <View style={[{height: 4}]} />
    </ThreadItemPostOuterWrapper>
  )
}

const ThreadItemPostOuterWrapper = memo(function ThreadItemPostOuterWrapper({
  item,
  overrides,
  children,
}: Pick<ThreadItemPostProps, 'item' | 'overrides'> & {
  children: ReactNode
}) {
  const t = useTheme()
  const showTopBorder =
    !item.ui.showParentReplyLine && overrides?.topBorder !== true

  return (
    <View
      style={[
        showTopBorder && [a.border_t, t.atoms.border_contrast_low],
        {paddingHorizontal: OUTER_SPACE},
        // If there's no next child, add a little padding to bottom
        !item.ui.showChildReplyLine &&
          !item.ui.precedesChildReadMore && {
            paddingBottom: OUTER_SPACE / 2,
          },
      ]}>
      {children}
    </View>
  )
})

/**
 * Provides some space between posts as well as contains the reply line
 */
const ThreadItemPostParentReplyLine = memo(
  function ThreadItemPostParentReplyLine({
    item,
  }: Pick<ThreadItemPostProps, 'item'>) {
    const t = useTheme()
    return (
      <View style={[a.flex_row, {height: 12}]}>
        <View style={{width: LINEAR_AVI_WIDTH}}>
          {item.ui.showParentReplyLine && (
            <View
              style={[
                a.mx_auto,
                a.flex_1,
                a.mb_xs,
                {
                  width: REPLY_LINE_WIDTH,
                  backgroundColor: t.atoms.border_contrast_low.borderColor,
                },
              ]}
            />
          )}
        </View>
      </View>
    )
  },
)

const ThreadItemPostInner = memo(function ThreadItemPostInner({
  item,
  postShadow,
  overrides,
  onPostSuccess,
  threadgateRecord,
}: ThreadItemPostProps & {
  postShadow: Shadow<AppBskyFeedDefs.PostView>
}) {
  const t = useTheme()
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
  const [limitLines, setLimitLines] = useState(
    () => countLines(richText?.text) >= MAX_POST_LINES,
  )
  const threadRootUri = record.reply?.root?.uri || post.uri
  const postHref = useMemo(() => {
    const urip = new AtUri(post.uri)
    return makeProfileLink(post.author, 'post', urip.rkey)
  }, [post.uri, post.author])
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const additionalPostAlerts: AppModerationCause[] = useMemo(() => {
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

  const onPressReply = useCallback(() => {
    openComposer({
      replyTo: {
        uri: post.uri,
        cid: post.cid,
        text: record.text,
        author: post.author,
        embed: post.embed,
        moderation,
        langs: post.record.langs,
      },
      onPostSuccess: onPostSuccess,
    })
  }, [openComposer, post, record, onPostSuccess, moderation])

  const onPressShowMore = useCallback(() => {
    setLimitLines(false)
  }, [setLimitLines])

  const {isActive: live} = useActorStatus(post.author)

  return (
    <SubtleHoverWrapper>
      <ThreadItemPostOuterWrapper item={item} overrides={overrides}>
        <PostHider
          testID={`postThreadItem-by-${post.author.handle}`}
          href={postHref}
          disabled={overrides?.moderation === true}
          modui={moderation.ui('contentList')}
          hiderStyle={[a.pl_0, a.pr_2xs, a.bg_transparent]}
          iconSize={LINEAR_AVI_WIDTH}
          iconStyles={[a.mr_xs]}
          profile={post.author}
          interpretFilterAsBlur>
          <ThreadItemPostParentReplyLine item={item} />

          <View style={[a.flex_row, a.gap_md]}>
            <View>
              <PreviewableUserAvatar
                size={LINEAR_AVI_WIDTH}
                profile={post.author}
                moderation={moderation.ui('avatar')}
                type={post.author.associated?.labeler ? 'labeler' : 'user'}
                live={live}
              />

              {(item.ui.showChildReplyLine ||
                item.ui.precedesChildReadMore) && (
                <View
                  style={[
                    a.mx_auto,
                    a.mt_xs,
                    a.flex_1,
                    {
                      width: REPLY_LINE_WIDTH,
                      backgroundColor: t.atoms.border_contrast_low.borderColor,
                    },
                  ]}
                />
              )}
            </View>

            <View style={[a.flex_1]}>
              <PostMeta
                author={post.author}
                moderation={moderation}
                timestamp={post.indexedAt}
                postHref={postHref}
                style={[a.pb_xs]}
              />
              <LabelsOnMyPost post={post} style={[a.pb_xs]} />
              <PostAlerts
                modui={moderation.ui('contentList')}
                style={[a.pb_2xs]}
                additionalCauses={additionalPostAlerts}
              />
              {richText?.text ? (
                <>
                  <RichText
                    enableTags
                    value={richText}
                    style={[a.flex_1, a.text_md]}
                    numberOfLines={limitLines ? MAX_POST_LINES : undefined}
                    authorHandle={post.author.handle}
                    shouldProxyLinks={true}
                  />
                  {limitLines && (
                    <ShowMoreTextButton
                      style={[a.text_md]}
                      onPress={onPressShowMore}
                    />
                  )}
                </>
              ) : undefined}
              {post.embed && (
                <View style={[a.pb_xs]}>
                  <Embed
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
              <DebugFieldDisplay subject={post} />
            </View>
          </View>
        </PostHider>
      </ThreadItemPostOuterWrapper>
    </SubtleHoverWrapper>
  )
})

function SubtleHoverWrapper({children}: {children: ReactNode}) {
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
      <SubtleHover hover={hover} />
      {children}
    </View>
  )
}

export function ThreadItemPostSkeleton({index}: {index: number}) {
  const even = index % 2 === 0
  return (
    <View
      style={[
        {paddingHorizontal: OUTER_SPACE, paddingVertical: OUTER_SPACE / 1.5},
        a.gap_md,
      ]}>
      <Skele.Row style={[a.align_start, a.gap_md]}>
        <Skele.Circle size={LINEAR_AVI_WIDTH} />

        <Skele.Col style={[a.gap_xs]}>
          <Skele.Row style={[a.gap_sm]}>
            <Skele.Text style={[a.text_md, {width: '20%'}]} />
            <Skele.Text blend style={[a.text_md, {width: '30%'}]} />
          </Skele.Row>

          <Skele.Col>
            {even ? (
              <>
                <Skele.Text blend style={[a.text_md, {width: '100%'}]} />
                <Skele.Text blend style={[a.text_md, {width: '60%'}]} />
              </>
            ) : (
              <Skele.Text blend style={[a.text_md, {width: '60%'}]} />
            )}
          </Skele.Col>

          <PostControlsSkeleton />
        </Skele.Col>
      </Skele.Row>
    </View>
  )
}

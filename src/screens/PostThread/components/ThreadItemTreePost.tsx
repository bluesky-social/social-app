import {memo, useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/macro'

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
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {ShowMoreTextButton} from '#/components/Post/ShowMoreTextButton'
import {PostControls} from '#/components/PostControls'
import {RichText} from '#/components/RichText'
import * as Skele from '#/components/Skeleton'
import {SubtleWebHover} from '#/components/SubtleWebHover'
import {Text} from '#/components/Typography'

/**
 * Mimic the space in PostMeta
 */
const TREE_AVI_PLUS_SPACE = TREE_AVI_WIDTH + a.gap_xs.gap

export function ThreadItemTreePost({
  item,
  overrides,
  onPostSuccess,
  threadgateRecord,
}: {
  item: Extract<ThreadItem, {type: 'threadPost'}>
  overrides?: {
    moderation?: boolean
    topBorder?: boolean
  }
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}) {
  const postShadow = usePostShadow(item.value.post)

  if (postShadow === POST_TOMBSTONE) {
    return <ThreadItemTreePostDeleted item={item} />
  }

  return (
    <ThreadItemTreePostInner
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

function ThreadItemTreePostDeleted({
  item,
}: {
  item: Extract<ThreadItem, {type: 'threadPost'}>
}) {
  const t = useTheme()
  return (
    <ThreadItemTreePostOuterWrapper item={item}>
      <ThreadItemTreePostInnerWrapper item={item}>
        <View
          style={[
            a.flex_row,
            a.align_center,
            a.rounded_sm,
            t.atoms.bg_contrast_25,
            {
              gap: 6,
              paddingHorizontal: OUTER_SPACE / 2,
              height: TREE_AVI_WIDTH,
            },
          ]}>
          <TrashIcon style={[t.atoms.text]} width={14} />
          <Text style={[t.atoms.text_contrast_medium, a.mt_2xs]}>
            <Trans>Post has been deleted</Trans>
          </Text>
        </View>
        {item.ui.isLastChild && !item.ui.precedesChildReadMore && (
          <View style={{height: OUTER_SPACE / 2}} />
        )}
      </ThreadItemTreePostInnerWrapper>
    </ThreadItemTreePostOuterWrapper>
  )
}

const ThreadItemTreePostOuterWrapper = memo(
  function ThreadItemTreePostOuterWrapper({
    item,
    children,
  }: {
    item: Extract<ThreadItem, {type: 'threadPost'}>
    children: React.ReactNode
  }) {
    const t = useTheme()
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
              key={`${item.value.post.uri}-padding-${n}`}
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
        {children}
      </View>
    )
  },
)

const ThreadItemTreePostInnerWrapper = memo(
  function ThreadItemTreePostInnerWrapper({
    item,
    children,
  }: {
    item: Extract<ThreadItem, {type: 'threadPost'}>
    children: React.ReactNode
  }) {
    const t = useTheme()
    return (
      <View
        style={[
          a.flex_1, // TODO check on ios
          {
            paddingHorizontal: OUTER_SPACE,
            paddingTop: OUTER_SPACE / 2,
          },
          item.ui.indent === 1 && [
            !item.ui.showParentReplyLine && a.pt_lg,
            !item.ui.showChildReplyLine && a.pb_sm,
          ],
          item.ui.isLastChild &&
            !item.ui.precedesChildReadMore && [
              {
                paddingBottom: OUTER_SPACE / 2,
              },
            ],
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
                  TREE_AVI_WIDTH / 2 + REPLY_LINE_WIDTH / 2 + OUTER_SPACE / 2,
                width: OUTER_SPACE,
                borderLeftWidth: REPLY_LINE_WIDTH,
                borderBottomWidth: REPLY_LINE_WIDTH,
                borderBottomLeftRadius: a.rounded_sm.borderRadius,
              },
            ]}
          />
        )}
        {children}
      </View>
    )
  },
)

const ThreadItemTreeReplyChildReplyLine = memo(
  function ThreadItemTreeReplyChildReplyLine({
    item,
  }: {
    item: Extract<ThreadItem, {type: 'threadPost'}>
  }) {
    const t = useTheme()
    return (
      <View style={[a.relative, a.pt_2xs, {width: TREE_AVI_PLUS_SPACE}]}>
        {item.ui.showChildReplyLine && (
          <View
            style={[
              a.flex_1,
              t.atoms.border_contrast_low,
              {borderRightWidth: 2, width: '50%', left: -1},
            ]}
          />
        )}
      </View>
    )
  },
)

const ThreadItemTreePostInner = memo(function ThreadItemTreePostInner({
  item,
  postShadow,
  overrides,
  onPostSuccess,
  threadgateRecord,
}: {
  item: Extract<ThreadItem, {type: 'threadPost'}>
  postShadow: Shadow<AppBskyFeedDefs.PostView>
  overrides?: {
    moderation?: boolean
    topBorder?: boolean
  }
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
}): React.ReactNode {
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

  return (
    <ThreadItemTreePostOuterWrapper item={item}>
      <SubtleHover>
        <PostHider
          testID={`postThreadItem-by-${post.author.handle}`}
          href={postHref}
          disabled={overrides?.moderation === true}
          modui={moderation.ui('contentList')}
          iconSize={42}
          iconStyles={{marginLeft: 2, marginRight: 2}}
          profile={post.author}
          interpretFilterAsBlur>
          <ThreadItemTreePostInnerWrapper item={item}>
            <View style={[a.flex_1]}>
              <PostMeta
                author={post.author}
                moderation={moderation}
                timestamp={post.indexedAt}
                postHref={postHref}
                avatarSize={TREE_AVI_WIDTH}
                style={[a.pb_0]}
                showAvatar
              />
              <View style={[a.flex_row]}>
                <ThreadItemTreeReplyChildReplyLine item={item} />
                <View style={[a.flex_1, a.pl_2xs]}>
                  <LabelsOnMyPost post={post} style={[a.pb_2xs]} />
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
                  ) : null}
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
                    variant="compact"
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
          </ThreadItemTreePostInnerWrapper>
        </PostHider>
      </SubtleHover>
    </ThreadItemTreePostOuterWrapper>
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
      style={[a.flex_1, a.pointer]}>
      <SubtleWebHover hover={hover} />
      {children}
    </View>
  )
}

export function ThreadItemTreePostSkeleton({index}: {index: number}) {
  const t = useTheme()
  const even = index % 2 === 0
  return (
    <View
      style={[
        {paddingHorizontal: OUTER_SPACE, paddingVertical: OUTER_SPACE / 1.5},
        a.gap_md,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <Skele.Row style={[a.align_start, a.gap_md]}>
        <Skele.Circle size={TREE_AVI_WIDTH} />

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

          <Skele.Row style={[a.justify_between, a.pt_xs]}>
            <Skele.Pill blend size={16} />
            <Skele.Pill blend size={16} />
            <Skele.Pill blend size={16} />
            <Skele.Circle blend size={16} />
            <View />
          </Skele.Row>
        </Skele.Col>
      </Skele.Row>
    </View>
  )
}

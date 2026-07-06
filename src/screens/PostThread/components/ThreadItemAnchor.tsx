import {memo, useMemo} from 'react'
import {View} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {
  POST_TOMBSTONE,
  type Shadow,
  usePostShadow,
} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useFeedFeedback} from '#/state/feed-feedback'
import {useSession} from '#/state/session'
import {type OnPostSuccessData} from '#/state/shell/composer'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {type PostSource} from '#/state/unstable-post-source'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {ReaderSeam} from '#/screens/PostThread/components/ReaderSeam'
import {
  ReaderBracket,
  ReaderSeamControls,
} from '#/screens/PostThread/components/ReaderSeamControls'
import {ThreadItemAnchorFollowButton} from '#/screens/PostThread/components/ThreadItemAnchorFollowButton'
import {ThreadPositionChip} from '#/screens/PostThread/components/ThreadPositionChip'
import {
  LINEAR_AVI_WIDTH,
  OUTER_SPACE,
  READER_LINE_INDENT,
  READER_SEAM_HEIGHT,
  REPLY_LINE_WIDTH,
} from '#/screens/PostThread/const'
import {
  type ReaderSeam as ReaderSeamData,
  type ThreadPostItem,
  type ThreadPostPosition,
} from '#/screens/PostThread/reader'
import {atoms as a, useTheme} from '#/alf'
import {DebugFieldDisplay} from '#/components/DebugFieldDisplay'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {GalleryBleed} from '#/components/images/Gallery'
import {Link} from '#/components/Link'
import {ContentHider} from '#/components/moderation/ContentHider'
import {LabelsOnMyPost} from '#/components/moderation/LabelsOnMe'
import {PostAlerts} from '#/components/moderation/PostAlerts'
import {type AppModerationCause} from '#/components/Pills'
import {Embed, PostEmbedViewContext} from '#/components/Post/Embed'
import {TranslatedPost} from '#/components/Post/Translated'
import {PostControlsSkeleton} from '#/components/PostControls'
import {ProfileBadges} from '#/components/ProfileBadges'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {RichText} from '#/components/RichText'
import * as Skele from '#/components/Skeleton'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {useActorStatus} from '#/features/liveNow'

export type ThreadItemAnchorReaderSeam = ReaderSeamData & {
  onToggle: () => void
  sort: string
}

export function ThreadItemAnchor({
  item,
  readerSeam,
  threadPosition,
  onPostSuccess,
  threadgateRecord,
  postSource,
}: {
  item: ThreadPostItem
  /**
   * Set in reader view: renders a bracket in the gutter and moves the anchor's
   * controls and replies into a seam below the post body.
   */
  readerSeam?: ThreadItemAnchorReaderSeam
  /**
   * Set in linear view when the anchor is part of a self-thread: renders a
   * "(x/n)" position chip at the end of the post text.
   */
  threadPosition?: ThreadPostPosition
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
  postSource?: PostSource
}) {
  const postShadow = usePostShadow(item.value.post)
  const threadRootUri = item.value.post.record.reply?.root?.uri || item.uri
  const isRoot = threadRootUri === item.uri

  if (postShadow === POST_TOMBSTONE) {
    return <ThreadItemAnchorDeleted isRoot={isRoot} />
  }

  return (
    <ThreadItemAnchorInner
      // Safeguard from clobbering per-post state below:
      key={postShadow.uri}
      item={item}
      isRoot={isRoot}
      readerSeam={readerSeam}
      threadPosition={threadPosition}
      postShadow={postShadow}
      onPostSuccess={onPostSuccess}
      threadgateRecord={threadgateRecord}
      postSource={postSource}
    />
  )
}

function ThreadItemAnchorDeleted({isRoot}: {isRoot: boolean}) {
  const t = useTheme()

  return (
    <>
      <ThreadItemAnchorParentReplyLine isRoot={isRoot} />

      <View
        style={[
          {
            paddingHorizontal: OUTER_SPACE,
            paddingBottom: OUTER_SPACE,
          },
          isRoot && [a.pt_lg],
        ]}>
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
      </View>
    </>
  )
}

function ThreadItemAnchorParentReplyLine({isRoot}: {isRoot: boolean}) {
  const t = useTheme()

  return !isRoot ? (
    <View style={[a.pl_lg, a.flex_row, a.pb_xs, {height: a.pt_lg.paddingTop}]}>
      <View style={{width: 42}}>
        <View
          style={[
            {
              width: REPLY_LINE_WIDTH,
              marginLeft: 'auto',
              marginRight: 'auto',
              flexGrow: 1,
              backgroundColor: t.atoms.border_contrast_low.borderColor,
            },
          ]}
        />
      </View>
    </View>
  ) : null
}

const ThreadItemAnchorInner = memo(function ThreadItemAnchorInner({
  item,
  isRoot,
  readerSeam,
  threadPosition,
  postShadow,
  onPostSuccess,
  threadgateRecord,
  postSource,
}: {
  item: ThreadPostItem
  isRoot: boolean
  readerSeam?: ThreadItemAnchorReaderSeam
  threadPosition?: ThreadPostPosition
  postShadow: Shadow<AppBskyFeedDefs.PostView>
  onPostSuccess?: (data: OnPostSuccessData) => void
  threadgateRecord?: AppBskyFeedThreadgate.Record
  postSource?: PostSource
}) {
  const inReader = !!readerSeam
  const t = useTheme()
  const ax = useAnalytics()
  const {currentAccount, hasSession} = useSession()
  const feedFeedback = useFeedFeedback(postSource?.feedSourceInfo, hasSession)

  const post = postShadow
  const record = item.value.post.record
  const moderation = item.moderation
  const authorShadow = useProfileShadow(post.author)
  const {isActive: live} = useActorStatus(post.author)
  const richText = useMemo(
    () =>
      new RichTextAPI({
        text: record.text,
        facets: record.facets,
      }),
    [record],
  )

  const authorHref = makeProfileLink(post.author)

  const threadRootUri = record.reply?.root?.uri || post.uri
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
  const onlyFollowersCanReply = !!threadgateRecord?.allow?.find(
    rule => rule.$type === 'app.bsky.feed.threadgate#followerRule',
  )
  const showFollowButton =
    currentAccount?.did !== post.author.did && !onlyFollowersCanReply

  const onOpenAuthor = () => {
    ax.metric('post:clickthroughAuthor', {
      uri: post.uri,
      authorDid: post.author.did,
      logContext: 'PostThreadItem',
      feedDescriptor: feedFeedback.feedDescriptor,
    })
    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughAuthor',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }

  const onOpenEmbed = () => {
    ax.metric('post:clickthroughEmbed', {
      uri: post.uri,
      authorDid: post.author.did,
      logContext: 'PostThreadItem',
      feedDescriptor: feedFeedback.feedDescriptor,
    })
    if (postSource) {
      feedFeedback.sendInteraction({
        item: post.uri,
        event: 'app.bsky.feed.defs#clickthroughEmbed',
        feedContext: postSource.post.feedContext,
        reqId: postSource.post.reqId,
      })
    }
  }

  return (
    <>
      <ThreadItemAnchorParentReplyLine isRoot={isRoot} />
      <GalleryBleed>
        <View
          testID={`postThreadItem-by-${post.author.handle}`}
          style={[
            {
              paddingHorizontal: OUTER_SPACE,
            },
            isRoot && [a.pt_lg],
          ]}>
          <View style={[a.flex_row, a.gap_md, a.pb_md]}>
            <View collapsable={false}>
              <PreviewableUserAvatar
                size={42}
                profile={post.author}
                moderation={moderation.ui('avatar')}
                type={post.author.associated?.labeler ? 'labeler' : 'user'}
                live={live}
                onBeforePress={onOpenAuthor}
              />
            </View>
            <Link
              to={authorHref}
              style={[a.flex_1]}
              label={sanitizeDisplayName(
                post.author.displayName || sanitizeHandle(post.author.handle),
                moderation.ui('displayName'),
              )}
              onPress={onOpenAuthor}>
              <View style={[a.flex_1, a.align_start]}>
                <ProfileHoverCard did={post.author.did} style={[a.w_full]}>
                  <View style={[a.flex_row, a.align_center]}>
                    <Text
                      emoji
                      style={[
                        a.flex_shrink,
                        a.text_lg,
                        a.font_semi_bold,
                        a.leading_snug,
                      ]}
                      numberOfLines={1}>
                      {sanitizeDisplayName(
                        post.author.displayName ||
                          sanitizeHandle(post.author.handle),
                        moderation.ui('displayName'),
                      )}
                    </Text>

                    <View style={[a.pl_xs]}>
                      <ProfileBadges
                        profile={authorShadow}
                        size="md"
                        interactive
                      />
                    </View>
                  </View>
                  <Text
                    style={[
                      a.text_md,
                      a.leading_snug,
                      t.atoms.text_contrast_medium,
                    ]}
                    numberOfLines={1}>
                    {sanitizeHandle(post.author.handle, '@')}
                  </Text>
                </ProfileHoverCard>
              </View>
            </Link>
            <View collapsable={false} style={[a.self_center]}>
              <ThreadItemAnchorFollowButton
                did={post.author.did}
                enabled={showFollowButton}
              />
            </View>
          </View>
          {/* Bracket wrapper: spans content + expanded details + replies */}
          <View>
            {inReader && (
              <ReaderBracket
                left={-(OUTER_SPACE - READER_LINE_INDENT)}
                bottom={
                  readerSeam?.expanded ? OUTER_SPACE : READER_SEAM_HEIGHT / 2
                }
              />
            )}
            <View style={[!inReader && a.pb_sm]}>
              <LabelsOnMyPost post={post} style={[a.pb_sm]} />
              <View>
                <ContentHider
                  modui={moderation.ui('contentView')}
                  ignoreMute
                  childContainerStyle={[a.pt_sm]}>
                  <PostAlerts
                    modui={moderation.ui('contentView')}
                    size="lg"
                    includeMute
                    style={[a.pb_sm]}
                    additionalCauses={additionalPostAlerts}
                  />
                  {richText?.text ? (
                    <View>
                      <RichText
                        enableTags
                        enableCode
                        selectable
                        value={richText}
                        style={[a.flex_1, a.text_lg]}
                        authorHandle={post.author.handle}
                        shouldProxyLinks={true}
                        trailing={
                          threadPosition ? (
                            <ThreadPositionChip
                              threadPosition={threadPosition}
                            />
                          ) : undefined
                        }
                      />
                    </View>
                  ) : threadPosition ? (
                    // Text-less anchors (e.g. image-only) still show their
                    // position so the numbering reads without gaps.
                    <ThreadPositionChip threadPosition={threadPosition} />
                  ) : undefined}
                  <TranslatedPost post={post} postTextStyle={[a.text_lg]} />
                  {post.embed && (
                    <View style={[richText?.text ? a.py_xs : []]}>
                      <Embed
                        embed={post.embed}
                        moderation={moderation}
                        viewContext={PostEmbedViewContext.ThreadHighlighted}
                        onOpen={onOpenEmbed}
                        post={post}
                        feedDescriptor={feedFeedback.feedDescriptor}
                      />
                    </View>
                  )}
                </ContentHider>
              </View>
              {/* In reader view the controls move to the seam below */}
              {!inReader && (
                <ReaderSeamControls
                  post={item}
                  postSource={postSource}
                  onPostSuccess={onPostSuccess}
                  threadgateRecord={threadgateRecord}
                />
              )}
              <DebugFieldDisplay subject={post} />
            </View>
            {readerSeam && (
              <ReaderSeam
                post={item}
                expanded={readerSeam.expanded}
                hiddenReplyCount={readerSeam.hiddenReplyCount}
                continuationUri={readerSeam.continuationUri}
                href={readerSeam.href}
                sort={readerSeam.sort}
                onToggle={readerSeam.onToggle}
                onPostSuccess={onPostSuccess}
                threadgateRecord={threadgateRecord}
              />
            )}
          </View>
        </View>
      </GalleryBleed>
    </>
  )
})

export function ThreadItemAnchorSkeleton() {
  return (
    <View style={[a.p_lg, a.gap_md]}>
      <Skele.Row style={[a.align_center, a.gap_md]}>
        <Skele.Circle size={42} />

        <Skele.Col>
          <Skele.Text style={[a.text_lg, {width: '20%'}]} />
          <Skele.Text blend style={[a.text_md, {width: '40%'}]} />
        </Skele.Col>
      </Skele.Row>

      <View>
        <Skele.Text style={[a.text_xl, {width: '100%'}]} />
        <Skele.Text style={[a.text_xl, {width: '60%'}]} />
      </View>

      <Skele.Text style={[a.text_sm, {width: '50%'}]} />

      <PostControlsSkeleton big />
    </View>
  )
}

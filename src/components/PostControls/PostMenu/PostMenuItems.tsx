import {memo, useMemo} from 'react'
import {
  Platform,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {getCurrentRoute} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {richTextToString} from '#/lib/strings/rich-text-helpers'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {useTranslate} from '#/lib/translation'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {
  useHiddenPosts,
  useHiddenPostsApi,
  useLanguagePrefs,
} from '#/state/preferences'
import {usePinnedPostMutation} from '#/state/queries/pinned-post'
import {
  usePostDeleteMutation,
  useThreadMuteMutationQueue,
} from '#/state/queries/post'
import {useToggleQuoteDetachmentMutation} from '#/state/queries/postgate'
import {getMaybeDetachedQuoteEmbed} from '#/state/queries/postgate/util'
import {
  useProfileBlockMutationQueue,
  useProfileMuteMutationQueue,
} from '#/state/queries/profile'
import {
  InvalidInteractionSettingsError,
  MAX_HIDDEN_REPLIES,
  MaxHiddenRepliesError,
  useToggleReplyVisibilityMutation,
} from '#/state/queries/threadgate'
import {useRequireAuth, useSession} from '#/state/session'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import * as Toast from '#/view/com/util/Toast'
import {useDialogControl} from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {
  PostInteractionSettingsDialog,
  usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {BubbleQuestion_Stroke2_Corner0_Rounded as Translate} from '#/components/icons/Bubble'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji'
import {Eye_Stroke2_Corner0_Rounded as Eye} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Filter_Stroke2_Corner0_Rounded as Filter} from '#/components/icons/Filter'
import {
  Mute_Stroke2_Corner0_Rounded as Mute,
  Mute_Stroke2_Corner0_Rounded as MuteIcon,
} from '#/components/icons/Mute'
import {PersonX_Stroke2_Corner0_Rounded as PersonX} from '#/components/icons/Person'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {SettingsGear2_Stroke2_Corner0_Rounded as Gear} from '#/components/icons/SettingsGear2'
import {
  SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute,
  SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon,
} from '#/components/icons/Speaker'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import {useAnalytics} from '#/analytics'
import {IS_INTERNAL} from '#/env'
import * as bsky from '#/types/bsky'

let PostMenuItems = ({
  post,
  postFeedContext,
  postReqId,
  record,
  richText,
  threadgateRecord,
  onShowLess,
  logContext,
  forceGoogleTranslate,
}: {
  testID: string
  post: Shadow<AppBskyFeedDefs.PostView>
  postFeedContext: string | undefined
  postReqId: string | undefined
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  style?: StyleProp<ViewStyle>
  hitSlop?: PressableProps['hitSlop']
  size?: 'lg' | 'md' | 'sm'
  timestamp: string
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  forceGoogleTranslate: boolean
}): React.ReactNode => {
  const {hasSession, currentAccount} = useSession()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const langPrefs = useLanguagePrefs()
  const {mutateAsync: deletePostMutate} = usePostDeleteMutation()
  const {mutateAsync: pinPostMutate, isPending: isPinPending} =
    usePinnedPostMutation()
  const requireSignIn = useRequireAuth()
  const hiddenPosts = useHiddenPosts()
  const {hidePost} = useHiddenPostsApi()
  const feedFeedback = useFeedFeedbackContext()
  const openLink = useOpenLink()
  const {clearTranslation, translate, translationState} = useTranslate({
    key: post.uri,
    forceGoogleTranslate,
  })
  const navigation = useNavigation<NavigationProp>()
  const {mutedWordsDialogControl} = useGlobalDialogsControlContext()
  const blockPromptControl = useDialogControl()
  const reportDialogControl = useReportDialogControl()
  const deletePromptControl = useDialogControl()
  const hidePromptControl = useDialogControl()
  const postInteractionSettingsDialogControl = useDialogControl()
  const quotePostDetachConfirmControl = useDialogControl()
  const hideReplyConfirmControl = useDialogControl()
  const {mutateAsync: toggleReplyVisibility} =
    useToggleReplyVisibilityMutation()

  const postUri = post.uri
  const postCid = post.cid
  const postAuthor = useProfileShadow(post.author)
  const quoteEmbed = useMemo(() => {
    if (!currentAccount || !post.embed) return
    return getMaybeDetachedQuoteEmbed({
      viewerDid: currentAccount.did,
      post,
    })
  }, [post, currentAccount])

  const rootUri = record.reply?.root?.uri || postUri
  const isReply = Boolean(record.reply)
  const [isThreadMuted, muteThread, unmuteThread] = useThreadMuteMutationQueue(
    post,
    rootUri,
  )
  const isPostHidden = hiddenPosts && hiddenPosts.includes(postUri)
  const isAuthor = postAuthor.did === currentAccount?.did
  const isRootPostAuthor = new AtUri(rootUri).host === currentAccount?.did
  const threadgateHiddenReplies = useMergedThreadgateHiddenReplies({
    threadgateRecord,
  })
  const isReplyHiddenByThreadgate = threadgateHiddenReplies.has(postUri)
  const isPinned = post.viewer?.pinned

  const {mutateAsync: toggleQuoteDetachment, isPending: isDetachPending} =
    useToggleQuoteDetachmentMutation()

  const [queueBlock] = useProfileBlockMutationQueue(postAuthor)
  const [queueMute, queueUnmute] = useProfileMuteMutationQueue(postAuthor)

  const prefetchPostInteractionSettings = usePrefetchPostInteractionSettings({
    postUri: post.uri,
    rootPostUri: rootUri,
  })

  const href = useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const onDeletePost = () => {
    deletePostMutate({uri: postUri}).then(
      () => {
        Toast.show(l({message: 'Post deleted', context: 'toast'}))

        const route = getCurrentRoute(navigation.getState())
        if (route.name === 'PostThread') {
          const params = route.params as CommonNavigatorParams['PostThread']
          if (
            currentAccount &&
            isAuthor &&
            (params.name === currentAccount.handle ||
              params.name === currentAccount.did)
          ) {
            const currentHref = makeProfileLink(postAuthor, 'post', params.rkey)
            if (currentHref === href && navigation.canGoBack()) {
              navigation.goBack()
            }
          }
        }
      },
      e => {
        logger.error('Failed to delete post', {message: e})
        Toast.show(l`Failed to delete post, please try again`, 'xmark')
      },
    )
  }

  const onToggleThreadMute = () => {
    try {
      if (isThreadMuted) {
        void unmuteThread()
        ax.metric('post:unmute', {
          uri: postUri,
          authorDid: postAuthor.did,
          logContext,
          feedDescriptor: feedFeedback.feedDescriptor,
        })
        Toast.show(l`You will now receive notifications for this thread`)
      } else {
        void muteThread()
        ax.metric('post:mute', {
          uri: postUri,
          authorDid: postAuthor.did,
          logContext,
          feedDescriptor: feedFeedback.feedDescriptor,
        })
        Toast.show(l`You will no longer receive notifications for this thread`)
      }
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        logger.error('Failed to toggle thread mute', {message: e})
        Toast.show(l`Failed to toggle thread mute, please try again`, 'xmark')
      }
    }
  }

  const onCopyPostText = () => {
    const str = richTextToString(richText, true)

    void Clipboard.setStringAsync(str)
    Toast.show(l`Copied to clipboard`, 'clipboard-check')
  }

  const onPressTranslate = () => {
    void translate({
      text: record.text,
      targetLangCode: langPrefs.primaryLanguage,
    })

    if (
      bsky.dangerousIsType<AppBskyFeedPost.Record>(
        post.record,
        AppBskyFeedPost.isRecord,
      )
    ) {
      ax.metric('translate', {
        sourceLanguages: post.record.langs ?? [],
        targetLanguage: langPrefs.primaryLanguage,
        textLength: post.record.text.length,
      })
    }
  }

  const onHidePost = () => {
    hidePost({uri: postUri})
    ax.metric('thread:click:hideReplyForMe', {})
  }

  const hideInPWI = !!postAuthor.labels?.find(
    label => label.val === '!no-unauthenticated',
  )

  const onPressShowMore = () => {
    feedFeedback.sendInteraction({
      event: 'app.bsky.feed.defs#requestMore',
      item: postUri,
      feedContext: postFeedContext,
      reqId: postReqId,
    })
    ax.metric('post:showMore', {
      uri: postUri,
      authorDid: postAuthor.did,
      logContext,
      feedDescriptor: feedFeedback.feedDescriptor,
    })
    Toast.show(l({message: 'Feedback sent to feed operator', context: 'toast'}))
  }

  const onPressShowLess = () => {
    feedFeedback.sendInteraction({
      event: 'app.bsky.feed.defs#requestLess',
      item: postUri,
      feedContext: postFeedContext,
      reqId: postReqId,
    })
    ax.metric('post:showLess', {
      uri: postUri,
      authorDid: postAuthor.did,
      logContext,
      feedDescriptor: feedFeedback.feedDescriptor,
    })
    if (onShowLess) {
      onShowLess({
        item: postUri,
        feedContext: postFeedContext,
      })
    } else {
      Toast.show(
        l({message: 'Feedback sent to feed operator', context: 'toast'}),
      )
    }
  }

  const onToggleQuotePostAttachment = async () => {
    if (!quoteEmbed) return

    const action = quoteEmbed.isDetached ? 'reattach' : 'detach'
    const isDetach = action === 'detach'

    try {
      await toggleQuoteDetachment({
        post,
        quoteUri: quoteEmbed.uri,
        action: quoteEmbed.isDetached ? 'reattach' : 'detach',
      })
      Toast.show(
        isDetach
          ? l`Quote post was successfully detached`
          : l`Quote post was re-attached`,
      )
    } catch (err) {
      const e = err as Error
      Toast.show(
        l({message: 'Updating quote attachment failed', context: 'toast'}),
      )
      logger.error(`Failed to ${action} quote`, {safeMessage: e.message})
    }
  }

  const canHidePostForMe = !isAuthor && !isPostHidden
  const canHideReplyForEveryone =
    !isAuthor && isRootPostAuthor && !isPostHidden && isReply
  const canDetachQuote = quoteEmbed && quoteEmbed.isOwnedByViewer

  const onToggleReplyVisibility = async () => {
    // TODO no threadgate?
    if (!canHideReplyForEveryone) return

    const action = isReplyHiddenByThreadgate ? 'show' : 'hide'
    const isHide = action === 'hide'

    try {
      await toggleReplyVisibility({
        postUri: rootUri,
        replyUri: postUri,
        action,
      })

      // Log metric only when hiding (not when showing)
      if (isHide) {
        ax.metric('thread:click:hideReplyForEveryone', {})
      }

      Toast.show(
        isHide
          ? l`Reply was successfully hidden`
          : l({message: 'Reply visibility updated', context: 'toast'}),
      )
    } catch (err) {
      const e = err as Error
      if (e instanceof MaxHiddenRepliesError) {
        Toast.show(
          plural(MAX_HIDDEN_REPLIES, {
            other: 'You can hide a maximum of # replies.',
          }),
        )
      } else if (e instanceof InvalidInteractionSettingsError) {
        Toast.show(
          l({message: 'Invalid interaction settings.', context: 'toast'}),
        )
      } else {
        Toast.show(
          l({
            message: 'Updating reply visibility failed',
            context: 'toast',
          }),
        )
        logger.error(`Failed to ${action} reply`, {safeMessage: e.message})
      }
    }
  }

  const onPressPin = () => {
    ax.metric(isPinned ? 'post:unpin' : 'post:pin', {})
    void pinPostMutate({
      postUri,
      postCid,
      action: isPinned ? 'unpin' : 'pin',
    })
  }

  const onBlockAuthor = async () => {
    try {
      await queueBlock()
      Toast.show(l({message: 'Account blocked', context: 'toast'}))
    } catch (err) {
      const e = err as Error
      if (e?.name !== 'AbortError') {
        logger.error('Failed to block account', {message: e})
        Toast.show(l`There was an issue! ${e.toString()}`, 'xmark')
      }
    }
  }

  const onMuteAuthor = async () => {
    if (postAuthor.viewer?.muted) {
      try {
        await queueUnmute()
        Toast.show(l({message: 'Account unmuted', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unmute account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, 'xmark')
        }
      }
    } else {
      try {
        await queueMute()
        Toast.show(l({message: 'Account muted', context: 'toast'}))
      } catch (err) {
        const e = err as Error
        if (e?.name !== 'AbortError') {
          logger.error('Failed to mute account', {message: e})
          Toast.show(l`There was an issue! ${e.toString()}`, 'xmark')
        }
      }
    }
  }

  const onReportMisclassification = () => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSd0QPqhNFksDQf1YyOos7r1ofCLvmrKAH1lU042TaS3GAZaWQ/viewform?entry.1756031717=${toShareUrl(
      href,
    )}`
    void openLink(url)
  }

  const onSignIn = () => requireSignIn(() => {})

  const onPressHideTranslation = () => clearTranslation()

  const isDiscoverDebugUser =
    IS_INTERNAL ||
    DISCOVER_DEBUG_DIDS[currentAccount?.did || ''] ||
    ax.features.enabled(ax.features.DebugFeedContext)

  return (
    <>
      <Menu.Outer>
        {isAuthor && (
          <>
            <Menu.Group>
              <Menu.Item
                testID="pinPostBtn"
                label={
                  isPinned ? l`Unpin from profile` : l`Pin to your profile`
                }
                disabled={isPinPending}
                onPress={onPressPin}>
                <Menu.ItemText>
                  {isPinned ? l`Unpin from profile` : l`Pin to your profile`}
                </Menu.ItemText>
                <Menu.ItemIcon
                  icon={isPinPending ? Loader : PinIcon}
                  position="right"
                />
              </Menu.Item>
            </Menu.Group>
            <Menu.Divider />
          </>
        )}

        <Menu.Group>
          {!hideInPWI || hasSession ? (
            <>
              {translationState.status === 'loading' ? (
                <Menu.Item
                  testID="postDropdownTranslateBtn"
                  label={l`Translating…`}
                  onPress={() => {}}>
                  <Menu.ItemText>{l`Translating…`}</Menu.ItemText>
                  <Menu.ItemIcon icon={Translate} position="right" />
                </Menu.Item>
              ) : translationState.status === 'success' ? (
                <Menu.Item
                  testID="postDropdownTranslateBtn"
                  label={l`Hide translation`}
                  onPress={onPressHideTranslation}>
                  <Menu.ItemText>{l`Hide translation`}</Menu.ItemText>
                  <Menu.ItemIcon icon={Translate} position="right" />
                </Menu.Item>
              ) : (
                <Menu.Item
                  testID="postDropdownTranslateBtn"
                  label={l`Translate`}
                  onPress={onPressTranslate}>
                  <Menu.ItemText>{l`Translate`}</Menu.ItemText>
                  <Menu.ItemIcon icon={Translate} position="right" />
                </Menu.Item>
              )}

              <Menu.Item
                testID="postDropdownCopyTextBtn"
                label={l`Copy post text`}
                onPress={onCopyPostText}>
                <Menu.ItemText>{l`Copy post text`}</Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
            </>
          ) : (
            <Menu.Item
              testID="postDropdownSignInBtn"
              label={l`Sign in to view post`}
              onPress={onSignIn}>
              <Menu.ItemText>{l`Sign in to view post`}</Menu.ItemText>
              <Menu.ItemIcon icon={Eye} position="right" />
            </Menu.Item>
          )}
        </Menu.Group>

        {hasSession && feedFeedback.enabled && (
          <>
            <Menu.Divider />
            <Menu.Group>
              <Menu.Item
                testID="postDropdownShowMoreBtn"
                label={l`Show more like this`}
                onPress={onPressShowMore}>
                <Menu.ItemText>{l`Show more like this`}</Menu.ItemText>
                <Menu.ItemIcon icon={EmojiSmile} position="right" />
              </Menu.Item>

              <Menu.Item
                testID="postDropdownShowLessBtn"
                label={l`Show less like this`}
                onPress={onPressShowLess}>
                <Menu.ItemText>{l`Show less like this`}</Menu.ItemText>
                <Menu.ItemIcon icon={EmojiSad} position="right" />
              </Menu.Item>
            </Menu.Group>
          </>
        )}

        {isDiscoverDebugUser && (
          <>
            <Menu.Divider />
            <Menu.Item
              testID="postDropdownReportMisclassificationBtn"
              label={l`Assign topic for algo`}
              onPress={onReportMisclassification}>
              <Menu.ItemText>{l`Assign topic for algo`}</Menu.ItemText>
              <Menu.ItemIcon icon={AtomIcon} position="right" />
            </Menu.Item>
          </>
        )}

        {hasSession && (
          <>
            <Menu.Divider />
            <Menu.Group>
              <Menu.Item
                testID="postDropdownMuteThreadBtn"
                label={isThreadMuted ? l`Unmute thread` : l`Mute thread`}
                onPress={onToggleThreadMute}>
                <Menu.ItemText>
                  {isThreadMuted ? l`Unmute thread` : l`Mute thread`}
                </Menu.ItemText>
                <Menu.ItemIcon
                  icon={isThreadMuted ? Unmute : Mute}
                  position="right"
                />
              </Menu.Item>

              <Menu.Item
                testID="postDropdownMuteWordsBtn"
                label={l`Mute words & tags`}
                onPress={() => mutedWordsDialogControl.open()}>
                <Menu.ItemText>{l`Mute words & tags`}</Menu.ItemText>
                <Menu.ItemIcon icon={Filter} position="right" />
              </Menu.Item>
            </Menu.Group>
          </>
        )}

        {hasSession &&
          (canHideReplyForEveryone || canDetachQuote || canHidePostForMe) && (
            <>
              <Menu.Divider />
              <Menu.Group>
                {canHidePostForMe && (
                  <Menu.Item
                    testID="postDropdownHideBtn"
                    label={isReply ? l`Hide reply for me` : l`Hide post for me`}
                    onPress={() => hidePromptControl.open()}>
                    <Menu.ItemText>
                      {isReply ? l`Hide reply for me` : l`Hide post for me`}
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={EyeSlash} position="right" />
                  </Menu.Item>
                )}
                {canHideReplyForEveryone && (
                  <Menu.Item
                    testID="postDropdownHideBtn"
                    label={
                      isReplyHiddenByThreadgate
                        ? l`Show reply for everyone`
                        : l`Hide reply for everyone`
                    }
                    onPress={
                      isReplyHiddenByThreadgate
                        ? onToggleReplyVisibility
                        : () => hideReplyConfirmControl.open()
                    }>
                    <Menu.ItemText>
                      {isReplyHiddenByThreadgate
                        ? l`Show reply for everyone`
                        : l`Hide reply for everyone`}
                    </Menu.ItemText>
                    <Menu.ItemIcon
                      icon={isReplyHiddenByThreadgate ? Eye : EyeSlash}
                      position="right"
                    />
                  </Menu.Item>
                )}

                {canDetachQuote && (
                  <Menu.Item
                    disabled={isDetachPending}
                    testID="postDropdownHideBtn"
                    label={
                      quoteEmbed.isDetached
                        ? l`Re-attach quote`
                        : l`Detach quote`
                    }
                    onPress={
                      quoteEmbed.isDetached
                        ? onToggleQuotePostAttachment
                        : () => quotePostDetachConfirmControl.open()
                    }>
                    <Menu.ItemText>
                      {quoteEmbed.isDetached
                        ? l`Re-attach quote`
                        : l`Detach quote`}
                    </Menu.ItemText>
                    <Menu.ItemIcon
                      icon={
                        isDetachPending
                          ? Loader
                          : quoteEmbed.isDetached
                            ? Eye
                            : EyeSlash
                      }
                      position="right"
                    />
                  </Menu.Item>
                )}
              </Menu.Group>
            </>
          )}

        {hasSession && (
          <>
            <Menu.Divider />
            <Menu.Group>
              {!isAuthor && (
                <>
                  <Menu.Item
                    testID="postDropdownMuteBtn"
                    label={
                      postAuthor.viewer?.muted
                        ? l`Unmute account`
                        : l`Mute account`
                    }
                    onPress={() => void onMuteAuthor()}>
                    <Menu.ItemText>
                      {postAuthor.viewer?.muted
                        ? l`Unmute account`
                        : l`Mute account`}
                    </Menu.ItemText>
                    <Menu.ItemIcon
                      icon={postAuthor.viewer?.muted ? UnmuteIcon : MuteIcon}
                      position="right"
                    />
                  </Menu.Item>

                  {!postAuthor.viewer?.blocking && (
                    <Menu.Item
                      testID="postDropdownBlockBtn"
                      label={l`Block account`}
                      onPress={() => blockPromptControl.open()}>
                      <Menu.ItemText>{l`Block account`}</Menu.ItemText>
                      <Menu.ItemIcon icon={PersonX} position="right" />
                    </Menu.Item>
                  )}

                  <Menu.Item
                    testID="postDropdownReportBtn"
                    label={l`Report post`}
                    onPress={() => reportDialogControl.open()}>
                    <Menu.ItemText>{l`Report post`}</Menu.ItemText>
                    <Menu.ItemIcon icon={Warning} position="right" />
                  </Menu.Item>
                </>
              )}

              {isAuthor && (
                <>
                  <Menu.Item
                    testID="postDropdownEditPostInteractions"
                    label={l`Edit interaction settings`}
                    onPress={() => postInteractionSettingsDialogControl.open()}
                    {...(isAuthor
                      ? Platform.select({
                          web: {
                            onHoverIn: prefetchPostInteractionSettings,
                          },
                          native: {
                            onPressIn: prefetchPostInteractionSettings,
                          },
                        })
                      : {})}>
                    <Menu.ItemText>
                      {l`Edit interaction settings`}
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={Gear} position="right" />
                  </Menu.Item>
                  <Menu.Item
                    testID="postDropdownDeleteBtn"
                    label={l`Delete post`}
                    onPress={() => deletePromptControl.open()}>
                    <Menu.ItemText>{l`Delete post`}</Menu.ItemText>
                    <Menu.ItemIcon icon={Trash} position="right" />
                  </Menu.Item>
                </>
              )}
            </Menu.Group>
          </>
        )}
      </Menu.Outer>
      <Prompt.Basic
        control={deletePromptControl}
        title={l`Delete this post?`}
        description={l`If you remove this post, you won't be able to recover it.`}
        onConfirm={onDeletePost}
        confirmButtonCta={l`Delete`}
        confirmButtonColor="negative"
      />
      <Prompt.Basic
        control={hidePromptControl}
        title={isReply ? l`Hide this reply?` : l`Hide this post?`}
        description={l`This post will be hidden from feeds and threads. This cannot be undone.`}
        onConfirm={onHidePost}
        confirmButtonCta={l`Hide`}
      />
      <ReportDialog
        control={reportDialogControl}
        subject={{
          ...post,
          $type: 'app.bsky.feed.defs#postView',
        }}
      />
      <PostInteractionSettingsDialog
        control={postInteractionSettingsDialogControl}
        postUri={post.uri}
        rootPostUri={rootUri}
        initialThreadgateView={post.threadgate}
      />
      <Prompt.Basic
        control={quotePostDetachConfirmControl}
        title={l`Detach quote post?`}
        description={l`This will remove your post from this quote post for all users, and replace it with a placeholder.`}
        onConfirm={() => void onToggleQuotePostAttachment()}
        confirmButtonCta={l`Yes, detach`}
      />
      <Prompt.Basic
        control={hideReplyConfirmControl}
        title={l`Hide this reply?`}
        description={l`This reply will be sorted into a hidden section at the bottom of your thread and will mute notifications for subsequent replies - both for yourself and others.`}
        onConfirm={() => void onToggleReplyVisibility()}
        confirmButtonCta={l`Yes, hide`}
      />
      <Prompt.Basic
        control={blockPromptControl}
        title={l`Block Account?`}
        description={l`Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`}
        onConfirm={() => void onBlockAuthor()}
        confirmButtonCta={l`Block`}
        confirmButtonColor="negative"
      />
    </>
  )
}
PostMenuItems = memo(PostMenuItems)
export {PostMenuItems}

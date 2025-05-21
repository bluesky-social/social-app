import React, {memo} from 'react'
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
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {IS_INTERNAL} from '#/lib/app-info'
import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {getCurrentRoute} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {shareText, shareUrl} from '#/lib/sharing'
import {logEvent} from '#/lib/statsig/statsig'
import {richTextToString} from '#/lib/strings/rich-text-helpers'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {getTranslatorLink} from '#/locale/helpers'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {type Shadow} from '#/state/cache/post-shadow'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useLanguagePrefs} from '#/state/preferences'
import {useHiddenPosts, useHiddenPostsApi} from '#/state/preferences'
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
import {useToggleReplyVisibilityMutation} from '#/state/queries/threadgate'
import {useSession} from '#/state/session'
import {useMergedThreadgateHiddenReplies} from '#/state/threadgate-hidden-replies'
import {useBreakpoints} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {EmbedDialog} from '#/components/dialogs/Embed'
import {
  PostInteractionSettingsDialog,
  usePrefetchPostInteractionSettings,
} from '#/components/dialogs/PostInteractionSettingsDialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {BubbleQuestion_Stroke2_Corner0_Rounded as Translate} from '#/components/icons/Bubble'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {CodeBrackets_Stroke2_Corner0_Rounded as CodeBrackets} from '#/components/icons/CodeBrackets'
import {
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji'
import {Eye_Stroke2_Corner0_Rounded as Eye} from '#/components/icons/Eye'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Filter_Stroke2_Corner0_Rounded as Filter} from '#/components/icons/Filter'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {PaperPlane_Stroke2_Corner0_Rounded as Send} from '#/components/icons/PaperPlane'
import {PersonX_Stroke2_Corner0_Rounded as PersonX} from '#/components/icons/Person'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {SettingsGear2_Stroke2_Corner0_Rounded as Gear} from '#/components/icons/SettingsGear2'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import {useDevMode} from '#/storage/hooks/dev-mode'
import * as bsky from '#/types/bsky'
import * as Toast from '../Toast'

let PostDropdownMenuItems = ({
  post,
  postFeedContext,
  postReqId,
  record,
  richText,
  timestamp,
  threadgateRecord,
  onShowLess,
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
}): React.ReactNode => {
  const {hasSession, currentAccount} = useSession()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const {mutateAsync: deletePostMutate} = usePostDeleteMutation()
  const {mutateAsync: pinPostMutate, isPending: isPinPending} =
    usePinnedPostMutation()
  const hiddenPosts = useHiddenPosts()
  const {hidePost} = useHiddenPostsApi()
  const feedFeedback = useFeedFeedbackContext()
  const openLink = useOpenLink()
  const navigation = useNavigation<NavigationProp>()
  const {mutedWordsDialogControl} = useGlobalDialogsControlContext()
  const blockPromptControl = useDialogControl()
  const reportDialogControl = useReportDialogControl()
  const deletePromptControl = useDialogControl()
  const hidePromptControl = useDialogControl()
  const loggedOutWarningPromptControl = useDialogControl()
  const embedPostControl = useDialogControl()
  const sendViaChatControl = useDialogControl()
  const postInteractionSettingsDialogControl = useDialogControl()
  const quotePostDetachConfirmControl = useDialogControl()
  const hideReplyConfirmControl = useDialogControl()
  const {mutateAsync: toggleReplyVisibility} =
    useToggleReplyVisibilityMutation()
  const [devModeEnabled] = useDevMode()

  const postUri = post.uri
  const postCid = post.cid
  const postAuthor = useProfileShadow(post.author)
  const quoteEmbed = React.useMemo(() => {
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

  const href = React.useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const translatorUrl = getTranslatorLink(
    record.text,
    langPrefs.primaryLanguage,
  )

  const onDeletePost = () => {
    deletePostMutate({uri: postUri}).then(
      () => {
        Toast.show(_(msg({message: 'Post deleted', context: 'toast'})))

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
        Toast.show(_(msg`Failed to delete post, please try again`), 'xmark')
      },
    )
  }

  const onToggleThreadMute = () => {
    try {
      if (isThreadMuted) {
        unmuteThread()
        Toast.show(_(msg`You will now receive notifications for this thread`))
      } else {
        muteThread()
        Toast.show(
          _(msg`You will no longer receive notifications for this thread`),
        )
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to toggle thread mute', {message: e})
        Toast.show(
          _(msg`Failed to toggle thread mute, please try again`),
          'xmark',
        )
      }
    }
  }

  const onCopyPostText = () => {
    const str = richTextToString(richText, true)

    Clipboard.setStringAsync(str)
    Toast.show(_(msg`Copied to clipboard`), 'clipboard-check')
  }

  const onPressTranslate = async () => {
    await openLink(translatorUrl, true)

    if (
      bsky.dangerousIsType<AppBskyFeedPost.Record>(
        post.record,
        AppBskyFeedPost.isRecord,
      )
    ) {
      logger.metric('translate', {
        sourceLanguages: post.record.langs ?? [],
        targetLanguage: langPrefs.primaryLanguage,
        textLength: post.record.text.length,
      })
    }
  }

  const onHidePost = () => {
    hidePost({uri: postUri})
  }

  const hideInPWI = !!postAuthor.labels?.find(
    label => label.val === '!no-unauthenticated',
  )

  const showLoggedOutWarning =
    postAuthor.did !== currentAccount?.did && hideInPWI

  const onSharePost = () => {
    const url = toShareUrl(href)
    shareUrl(url)
  }

  const onPressShowMore = () => {
    feedFeedback.sendInteraction({
      event: 'app.bsky.feed.defs#requestMore',
      item: postUri,
      feedContext: postFeedContext,
      reqId: postReqId,
    })
    Toast.show(_(msg({message: 'Feedback sent!', context: 'toast'})))
  }

  const onPressShowLess = () => {
    feedFeedback.sendInteraction({
      event: 'app.bsky.feed.defs#requestLess',
      item: postUri,
      feedContext: postFeedContext,
      reqId: postReqId,
    })
    if (onShowLess) {
      onShowLess({
        item: postUri,
        feedContext: postFeedContext,
      })
    } else {
      Toast.show(_(msg({message: 'Feedback sent!', context: 'toast'})))
    }
  }

  const onSelectChatToShareTo = (conversation: string) => {
    navigation.navigate('MessagesConversation', {
      conversation,
      embed: postUri,
    })
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
          ? _(msg`Quote post was successfully detached`)
          : _(msg`Quote post was re-attached`),
      )
    } catch (e: any) {
      Toast.show(
        _(msg({message: 'Updating quote attachment failed', context: 'toast'})),
      )
      logger.error(`Failed to ${action} quote`, {safeMessage: e.message})
    }
  }

  const canHidePostForMe = !isAuthor && !isPostHidden
  const canEmbed = isWeb && gtMobile && !hideInPWI
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
      Toast.show(
        isHide
          ? _(msg`Reply was successfully hidden`)
          : _(msg({message: 'Reply visibility updated', context: 'toast'})),
      )
    } catch (e: any) {
      Toast.show(
        _(msg({message: 'Updating reply visibility failed', context: 'toast'})),
      )
      logger.error(`Failed to ${action} reply`, {safeMessage: e.message})
    }
  }

  const onPressPin = () => {
    logEvent(isPinned ? 'post:unpin' : 'post:pin', {})
    pinPostMutate({
      postUri,
      postCid,
      action: isPinned ? 'unpin' : 'pin',
    })
  }

  const onBlockAuthor = async () => {
    try {
      await queueBlock()
      Toast.show(_(msg({message: 'Account blocked', context: 'toast'})))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        logger.error('Failed to block account', {message: e})
        Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
      }
    }
  }

  const onMuteAuthor = async () => {
    if (postAuthor.viewer?.muted) {
      try {
        await queueUnmute()
        Toast.show(_(msg({message: 'Account unmuted', context: 'toast'})))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to unmute account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    } else {
      try {
        await queueMute()
        Toast.show(_(msg({message: 'Account muted', context: 'toast'})))
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Failed to mute account', {message: e})
          Toast.show(_(msg`There was an issue! ${e.toString()}`), 'xmark')
        }
      }
    }
  }

  const onShareATURI = () => {
    shareText(postUri)
  }

  const onShareAuthorDID = () => {
    shareText(postAuthor.did)
  }

  const onReportMisclassification = () => {
    const url = `https://docs.google.com/forms/d/e/1FAIpQLSd0QPqhNFksDQf1YyOos7r1ofCLvmrKAH1lU042TaS3GAZaWQ/viewform?entry.1756031717=${toShareUrl(
      href,
    )}`
    openLink(url)
  }

  return (
    <>
      <Menu.Outer>
        {isAuthor && (
          <>
            <Menu.Group>
              <Menu.Item
                testID="pinPostBtn"
                label={
                  isPinned
                    ? _(msg`Unpin from profile`)
                    : _(msg`Pin to your profile`)
                }
                disabled={isPinPending}
                onPress={onPressPin}>
                <Menu.ItemText>
                  {isPinned
                    ? _(msg`Unpin from profile`)
                    : _(msg`Pin to your profile`)}
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
          {(!hideInPWI || hasSession) && (
            <>
              <Menu.Item
                testID="postDropdownTranslateBtn"
                label={_(msg`Translate`)}
                onPress={onPressTranslate}>
                <Menu.ItemText>{_(msg`Translate`)}</Menu.ItemText>
                <Menu.ItemIcon icon={Translate} position="right" />
              </Menu.Item>

              <Menu.Item
                testID="postDropdownCopyTextBtn"
                label={_(msg`Copy post text`)}
                onPress={onCopyPostText}>
                <Menu.ItemText>{_(msg`Copy post text`)}</Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
            </>
          )}

          {hasSession && (
            <Menu.Item
              testID="postDropdownSendViaDMBtn"
              label={_(msg`Send via direct message`)}
              onPress={() => sendViaChatControl.open()}>
              <Menu.ItemText>
                <Trans>Send via direct message</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Send} position="right" />
            </Menu.Item>
          )}

          <Menu.Item
            testID="postDropdownShareBtn"
            label={isWeb ? _(msg`Copy link to post`) : _(msg`Share`)}
            onPress={() => {
              if (showLoggedOutWarning) {
                loggedOutWarningPromptControl.open()
              } else {
                onSharePost()
              }
            }}>
            <Menu.ItemText>
              {isWeb ? _(msg`Copy link to post`) : _(msg`Share`)}
            </Menu.ItemText>
            <Menu.ItemIcon icon={Share} position="right" />
          </Menu.Item>

          {canEmbed && (
            <Menu.Item
              testID="postDropdownEmbedBtn"
              label={_(msg`Embed post`)}
              onPress={() => embedPostControl.open()}>
              <Menu.ItemText>{_(msg`Embed post`)}</Menu.ItemText>
              <Menu.ItemIcon icon={CodeBrackets} position="right" />
            </Menu.Item>
          )}
        </Menu.Group>

        {hasSession && feedFeedback.enabled && (
          <>
            <Menu.Divider />
            <Menu.Group>
              <Menu.Item
                testID="postDropdownShowMoreBtn"
                label={_(msg`Show more like this`)}
                onPress={onPressShowMore}>
                <Menu.ItemText>{_(msg`Show more like this`)}</Menu.ItemText>
                <Menu.ItemIcon icon={EmojiSmile} position="right" />
              </Menu.Item>

              <Menu.Item
                testID="postDropdownShowLessBtn"
                label={_(msg`Show less like this`)}
                onPress={onPressShowLess}>
                <Menu.ItemText>{_(msg`Show less like this`)}</Menu.ItemText>
                <Menu.ItemIcon icon={EmojiSad} position="right" />
              </Menu.Item>
            </Menu.Group>
          </>
        )}

        {hasSession &&
          IS_INTERNAL &&
          DISCOVER_DEBUG_DIDS[currentAccount?.did ?? ''] && (
            <Menu.Item
              testID="postDropdownReportMisclassificationBtn"
              label={_(msg`Assign topic - help train Discover!`)}
              onPress={onReportMisclassification}>
              <Menu.ItemText>
                {_(msg`Assign topic - help train Discover!`)}
              </Menu.ItemText>
              <Menu.ItemIcon icon={AtomIcon} position="right" />
            </Menu.Item>
          )}

        {hasSession && (
          <>
            <Menu.Divider />
            <Menu.Group>
              <Menu.Item
                testID="postDropdownMuteThreadBtn"
                label={
                  isThreadMuted ? _(msg`Unmute thread`) : _(msg`Mute thread`)
                }
                onPress={onToggleThreadMute}>
                <Menu.ItemText>
                  {isThreadMuted ? _(msg`Unmute thread`) : _(msg`Mute thread`)}
                </Menu.ItemText>
                <Menu.ItemIcon
                  icon={isThreadMuted ? Unmute : Mute}
                  position="right"
                />
              </Menu.Item>

              <Menu.Item
                testID="postDropdownMuteWordsBtn"
                label={_(msg`Mute words & tags`)}
                onPress={() => mutedWordsDialogControl.open()}>
                <Menu.ItemText>{_(msg`Mute words & tags`)}</Menu.ItemText>
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
                    label={
                      isReply
                        ? _(msg`Hide reply for me`)
                        : _(msg`Hide post for me`)
                    }
                    onPress={() => hidePromptControl.open()}>
                    <Menu.ItemText>
                      {isReply
                        ? _(msg`Hide reply for me`)
                        : _(msg`Hide post for me`)}
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={EyeSlash} position="right" />
                  </Menu.Item>
                )}
                {canHideReplyForEveryone && (
                  <Menu.Item
                    testID="postDropdownHideBtn"
                    label={
                      isReplyHiddenByThreadgate
                        ? _(msg`Show reply for everyone`)
                        : _(msg`Hide reply for everyone`)
                    }
                    onPress={
                      isReplyHiddenByThreadgate
                        ? onToggleReplyVisibility
                        : () => hideReplyConfirmControl.open()
                    }>
                    <Menu.ItemText>
                      {isReplyHiddenByThreadgate
                        ? _(msg`Show reply for everyone`)
                        : _(msg`Hide reply for everyone`)}
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
                        ? _(msg`Re-attach quote`)
                        : _(msg`Detach quote`)
                    }
                    onPress={
                      quoteEmbed.isDetached
                        ? onToggleQuotePostAttachment
                        : () => quotePostDetachConfirmControl.open()
                    }>
                    <Menu.ItemText>
                      {quoteEmbed.isDetached
                        ? _(msg`Re-attach quote`)
                        : _(msg`Detach quote`)}
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
                        ? _(msg`Unmute account`)
                        : _(msg`Mute account`)
                    }
                    onPress={onMuteAuthor}>
                    <Menu.ItemText>
                      {postAuthor.viewer?.muted
                        ? _(msg`Unmute account`)
                        : _(msg`Mute account`)}
                    </Menu.ItemText>
                    <Menu.ItemIcon
                      icon={postAuthor.viewer?.muted ? UnmuteIcon : MuteIcon}
                      position="right"
                    />
                  </Menu.Item>

                  {!postAuthor.viewer?.blocking && (
                    <Menu.Item
                      testID="postDropdownBlockBtn"
                      label={_(msg`Block account`)}
                      onPress={() => blockPromptControl.open()}>
                      <Menu.ItemText>{_(msg`Block account`)}</Menu.ItemText>
                      <Menu.ItemIcon icon={PersonX} position="right" />
                    </Menu.Item>
                  )}

                  <Menu.Item
                    testID="postDropdownReportBtn"
                    label={_(msg`Report post`)}
                    onPress={() => reportDialogControl.open()}>
                    <Menu.ItemText>{_(msg`Report post`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={Warning} position="right" />
                  </Menu.Item>
                </>
              )}

              {isAuthor && (
                <>
                  <Menu.Item
                    testID="postDropdownEditPostInteractions"
                    label={_(msg`Edit interaction settings`)}
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
                      {_(msg`Edit interaction settings`)}
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={Gear} position="right" />
                  </Menu.Item>
                  <Menu.Item
                    testID="postDropdownDeleteBtn"
                    label={_(msg`Delete post`)}
                    onPress={() => deletePromptControl.open()}>
                    <Menu.ItemText>{_(msg`Delete post`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={Trash} position="right" />
                  </Menu.Item>
                </>
              )}
            </Menu.Group>

            {devModeEnabled ? (
              <>
                <Menu.Divider />
                <Menu.Group>
                  <Menu.Item
                    testID="postAtUriShareBtn"
                    label={_(msg`Copy post at:// URI`)}
                    onPress={onShareATURI}>
                    <Menu.ItemText>{_(msg`Copy post at:// URI`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={Share} position="right" />
                  </Menu.Item>
                  <Menu.Item
                    testID="postAuthorDIDShareBtn"
                    label={_(msg`Copy author DID`)}
                    onPress={onShareAuthorDID}>
                    <Menu.ItemText>{_(msg`Copy author DID`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={Share} position="right" />
                  </Menu.Item>
                </Menu.Group>
              </>
            ) : null}
          </>
        )}
      </Menu.Outer>

      <Prompt.Basic
        control={deletePromptControl}
        title={_(msg`Delete this post?`)}
        description={_(
          msg`If you remove this post, you won't be able to recover it.`,
        )}
        onConfirm={onDeletePost}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
      />

      <Prompt.Basic
        control={hidePromptControl}
        title={isReply ? _(msg`Hide this reply?`) : _(msg`Hide this post?`)}
        description={_(
          msg`This post will be hidden from feeds and threads. This cannot be undone.`,
        )}
        onConfirm={onHidePost}
        confirmButtonCta={_(msg`Hide`)}
      />

      <ReportDialog
        control={reportDialogControl}
        subject={{
          ...post,
          $type: 'app.bsky.feed.defs#postView',
        }}
      />

      <Prompt.Basic
        control={loggedOutWarningPromptControl}
        title={_(msg`Note about sharing`)}
        description={_(
          msg`This post is only visible to logged-in users. It won't be visible to people who aren't signed in.`,
        )}
        onConfirm={onSharePost}
        confirmButtonCta={_(msg`Share anyway`)}
      />

      {canEmbed && (
        <EmbedDialog
          control={embedPostControl}
          postCid={postCid}
          postUri={postUri}
          record={record}
          postAuthor={postAuthor}
          timestamp={timestamp}
        />
      )}

      <SendViaChatDialog
        control={sendViaChatControl}
        onSelectChat={onSelectChatToShareTo}
      />

      <PostInteractionSettingsDialog
        control={postInteractionSettingsDialogControl}
        postUri={post.uri}
        rootPostUri={rootUri}
        initialThreadgateView={post.threadgate}
      />

      <Prompt.Basic
        control={quotePostDetachConfirmControl}
        title={_(msg`Detach quote post?`)}
        description={_(
          msg`This will remove your post from this quote post for all users, and replace it with a placeholder.`,
        )}
        onConfirm={onToggleQuotePostAttachment}
        confirmButtonCta={_(msg`Yes, detach`)}
      />

      <Prompt.Basic
        control={hideReplyConfirmControl}
        title={_(msg`Hide this reply?`)}
        description={_(
          msg`This reply will be sorted into a hidden section at the bottom of your thread and will mute notifications for subsequent replies - both for yourself and others.`,
        )}
        onConfirm={onToggleReplyVisibility}
        confirmButtonCta={_(msg`Yes, hide`)}
      />

      <Prompt.Basic
        control={blockPromptControl}
        title={_(msg`Block Account?`)}
        description={_(
          msg`Blocked accounts cannot reply in your threads, mention you, or otherwise interact with you.`,
        )}
        onConfirm={onBlockAuthor}
        confirmButtonCta={_(msg`Block`)}
        confirmButtonColor="negative"
      />
    </>
  )
}
PostDropdownMenuItems = memo(PostDropdownMenuItems)
export {PostDropdownMenuItems}

import React, {memo} from 'react'
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {makeProfileLink} from '#/lib/routes/links'
import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {richTextToString} from '#/lib/strings/rich-text-helpers'
import {getTranslatorLink} from '#/locale/helpers'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {Shadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {useLanguagePrefs} from '#/state/preferences'
import {useHiddenPosts, useHiddenPostsApi} from '#/state/preferences'
import {useOpenLink} from '#/state/preferences/in-app-browser'
import {
  usePostDeleteMutation,
  useThreadMuteMutationQueue,
} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {getCurrentRoute} from 'lib/routes/helpers'
import {shareUrl} from 'lib/sharing'
import {toShareUrl} from 'lib/strings/url-helpers'
import {useTheme} from 'lib/ThemeContext'
import {atoms as a, useBreakpoints, useTheme as useAlf} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {EmbedDialog} from '#/components/dialogs/Embed'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as Share} from '#/components/icons/ArrowOutOfBox'
import {BubbleQuestion_Stroke2_Corner0_Rounded as Translate} from '#/components/icons/Bubble'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {CodeBrackets_Stroke2_Corner0_Rounded as CodeBrackets} from '#/components/icons/CodeBrackets'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Filter_Stroke2_Corner0_Rounded as Filter} from '#/components/icons/Filter'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {PaperPlane_Stroke2_Corner0_Rounded as Send} from '#/components/icons/PaperPlane'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import {Trash_Stroke2_Corner0_Rounded as Trash} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {ReportDialog, useReportDialogControl} from '#/components/ReportDialog'
import {EventStopper} from '../EventStopper'
import * as Toast from '../Toast'

let PostDropdownBtn = ({
  testID,
  post,
  postFeedContext,
  record,
  richText,
  style,
  hitSlop,
  size,
  timestamp,
}: {
  testID: string
  post: Shadow<AppBskyFeedDefs.PostView>
  postFeedContext: string | undefined
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  style?: StyleProp<ViewStyle>
  hitSlop?: PressableProps['hitSlop']
  size?: 'lg' | 'md' | 'sm'
  timestamp: string
}): React.ReactNode => {
  const {hasSession, currentAccount} = useSession()
  const theme = useTheme()
  const alf = useAlf()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const defaultCtrlColor = theme.palette.default.postCtrl
  const langPrefs = useLanguagePrefs()
  const postDeleteMutation = usePostDeleteMutation()
  const hiddenPosts = useHiddenPosts()
  const {hidePost} = useHiddenPostsApi()
  const feedFeedback = useFeedFeedbackContext()
  const openLink = useOpenLink()
  const navigation = useNavigation<NavigationProp>()
  const {mutedWordsDialogControl} = useGlobalDialogsControlContext()
  const reportDialogControl = useReportDialogControl()
  const deletePromptControl = useDialogControl()
  const hidePromptControl = useDialogControl()
  const loggedOutWarningPromptControl = useDialogControl()
  const embedPostControl = useDialogControl()
  const sendViaChatControl = useDialogControl()
  const postUri = post.uri
  const postCid = post.cid
  const postAuthor = post.author

  const rootUri = record.reply?.root?.uri || postUri
  const [isThreadMuted, muteThread, unmuteThread] = useThreadMuteMutationQueue(
    post,
    rootUri,
  )
  const isPostHidden = hiddenPosts && hiddenPosts.includes(postUri)
  const isAuthor = postAuthor.did === currentAccount?.did

  const href = React.useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const translatorUrl = getTranslatorLink(
    record.text,
    langPrefs.primaryLanguage,
  )

  const onDeletePost = React.useCallback(() => {
    postDeleteMutation.mutateAsync({uri: postUri}).then(
      () => {
        Toast.show(_(msg`Post deleted`))

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
        Toast.show(_(msg`Failed to delete post, please try again`))
      },
    )
  }, [
    navigation,
    postUri,
    postDeleteMutation,
    postAuthor,
    currentAccount,
    isAuthor,
    href,
    _,
  ])

  const onToggleThreadMute = React.useCallback(() => {
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
        Toast.show(_(msg`Failed to toggle thread mute, please try again`))
      }
    }
  }, [isThreadMuted, unmuteThread, _, muteThread])

  const onCopyPostText = React.useCallback(() => {
    const str = richTextToString(richText, true)

    Clipboard.setStringAsync(str)
    Toast.show(_(msg`Copied to clipboard`))
  }, [_, richText])

  const onPressTranslate = React.useCallback(() => {
    openLink(translatorUrl)
  }, [openLink, translatorUrl])

  const onHidePost = React.useCallback(() => {
    hidePost({uri: postUri})
  }, [postUri, hidePost])

  const hideInPWI = React.useMemo(() => {
    return !!postAuthor.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
  }, [postAuthor])

  const showLoggedOutWarning =
    postAuthor.did !== currentAccount?.did && hideInPWI

  const onSharePost = React.useCallback(() => {
    const url = toShareUrl(href)
    shareUrl(url)
  }, [href])

  const onPressShowMore = React.useCallback(() => {
    feedFeedback.sendInteraction({
      event: 'app.bsky.feed.defs#requestMore',
      item: postUri,
      feedContext: postFeedContext,
    })
    Toast.show('Feedback sent!')
  }, [feedFeedback, postUri, postFeedContext])

  const onPressShowLess = React.useCallback(() => {
    feedFeedback.sendInteraction({
      event: 'app.bsky.feed.defs#requestLess',
      item: postUri,
      feedContext: postFeedContext,
    })
    Toast.show('Feedback sent!')
  }, [feedFeedback, postUri, postFeedContext])

  const onSelectChatToShareTo = React.useCallback(
    (conversation: string) => {
      navigation.navigate('MessagesConversation', {
        conversation,
        embed: postUri,
      })
    },
    [navigation, postUri],
  )

  const canEmbed = isWeb && gtMobile && !hideInPWI

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Open post options menu`)}>
          {({props, state}) => {
            return (
              <Pressable
                {...props}
                hitSlop={hitSlop}
                testID={testID}
                style={[
                  style,
                  a.rounded_full,
                  (state.hovered || state.pressed) && [
                    alf.atoms.bg_contrast_25,
                  ],
                ]}>
                <DotsHorizontal
                  fill={defaultCtrlColor}
                  style={{pointerEvents: 'none'}}
                  size={size}
                />
              </Pressable>
            )
          }}
        </Menu.Trigger>

        <Menu.Outer>
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
                onPress={sendViaChatControl.open}>
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
                onPress={embedPostControl.open}>
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
                    {isThreadMuted
                      ? _(msg`Unmute thread`)
                      : _(msg`Mute thread`)}
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

                {!isAuthor && !isPostHidden && (
                  <Menu.Item
                    testID="postDropdownHideBtn"
                    label={_(msg`Hide post`)}
                    onPress={hidePromptControl.open}>
                    <Menu.ItemText>{_(msg`Hide post`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={EyeSlash} position="right" />
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
                  <Menu.Item
                    testID="postDropdownReportBtn"
                    label={_(msg`Report post`)}
                    onPress={() => reportDialogControl.open()}>
                    <Menu.ItemText>{_(msg`Report post`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={Warning} position="right" />
                  </Menu.Item>
                )}

                {isAuthor && (
                  <Menu.Item
                    testID="postDropdownDeleteBtn"
                    label={_(msg`Delete post`)}
                    onPress={deletePromptControl.open}>
                    <Menu.ItemText>{_(msg`Delete post`)}</Menu.ItemText>
                    <Menu.ItemIcon icon={Trash} position="right" />
                  </Menu.Item>
                )}
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>

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
        title={_(msg`Hide this post?`)}
        description={_(msg`This post will be hidden from feeds.`)}
        onConfirm={onHidePost}
        confirmButtonCta={_(msg`Hide`)}
      />

      <ReportDialog
        control={reportDialogControl}
        params={{
          type: 'post',
          uri: postUri,
          cid: postCid,
        }}
      />

      <Prompt.Basic
        control={loggedOutWarningPromptControl}
        title={_(msg`Note about sharing`)}
        description={_(
          msg`This post is only visible to logged-in users. It won't be visible to people who aren't logged in.`,
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
    </EventStopper>
  )
}

PostDropdownBtn = memo(PostDropdownBtn)
export {PostDropdownBtn}

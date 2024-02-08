import React, {memo} from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {
  AppBskyActorDefs,
  AppBskyFeedPost,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {toShareUrl} from 'lib/strings/url-helpers'
import {useTheme} from 'lib/ThemeContext'
import {shareUrl} from 'lib/sharing'
import {
  NativeDropdown,
  DropdownItem as NativeDropdownItem,
} from './NativeDropdown'
import * as Toast from '../Toast'
import {EventStopper} from '../EventStopper'
import {useModalControls} from '#/state/modals'
import {makeProfileLink} from '#/lib/routes/links'
import {getTranslatorLink} from '#/locale/helpers'
import {usePostDeleteMutation} from '#/state/queries/post'
import {useMutedThreads, useToggleThreadMute} from '#/state/muted-threads'
import {useLanguagePrefs} from '#/state/preferences'
import {useHiddenPosts, useHiddenPostsApi} from '#/state/preferences'
import {useOpenLink} from '#/state/preferences/in-app-browser'
import {logger} from '#/logger'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useSession} from '#/state/session'
import {isWeb} from '#/platform/detection'
import {richTextToString} from '#/lib/strings/rich-text-helpers'

let PostDropdownBtn = ({
  testID,
  postAuthor,
  postCid,
  postUri,
  record,
  richText,
  style,
  showAppealLabelItem,
}: {
  testID: string
  postAuthor: AppBskyActorDefs.ProfileViewBasic
  postCid: string
  postUri: string
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  style?: StyleProp<ViewStyle>
  showAppealLabelItem?: boolean
}): React.ReactNode => {
  const {hasSession, currentAccount} = useSession()
  const theme = useTheme()
  const {_} = useLingui()
  const defaultCtrlColor = theme.palette.default.postCtrl
  const {openModal} = useModalControls()
  const langPrefs = useLanguagePrefs()
  const mutedThreads = useMutedThreads()
  const toggleThreadMute = useToggleThreadMute()
  const postDeleteMutation = usePostDeleteMutation()
  const hiddenPosts = useHiddenPosts()
  const {hidePost} = useHiddenPostsApi()
  const openLink = useOpenLink()

  const rootUri = record.reply?.root?.uri || postUri
  const isThreadMuted = mutedThreads.includes(rootUri)
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
      },
      e => {
        logger.error('Failed to delete post', {message: e})
        Toast.show(_(msg`Failed to delete post, please try again`))
      },
    )
  }, [postUri, postDeleteMutation, _])

  const onToggleThreadMute = React.useCallback(() => {
    try {
      const muted = toggleThreadMute(rootUri)
      if (muted) {
        Toast.show(
          _(msg`You will no longer receive notifications for this thread`),
        )
      } else {
        Toast.show(_(msg`You will now receive notifications for this thread`))
      }
    } catch (e) {
      logger.error('Failed to toggle thread mute', {message: e})
    }
  }, [rootUri, toggleThreadMute, _])

  const onCopyPostText = React.useCallback(() => {
    const str = richTextToString(richText, true)

    Clipboard.setString(str)
    Toast.show(_(msg`Copied to clipboard`))
  }, [_, richText])

  const onOpenTranslate = React.useCallback(() => {
    openLink(translatorUrl)
  }, [openLink, translatorUrl])

  const onHidePost = React.useCallback(() => {
    hidePost({uri: postUri})
  }, [postUri, hidePost])

  const dropdownItems: NativeDropdownItem[] = [
    {
      label: _(msg`Translate`),
      onPress() {
        onOpenTranslate()
      },
      testID: 'postDropdownTranslateBtn',
      icon: {
        ios: {
          name: 'character.book.closed',
        },
        android: 'ic_menu_sort_alphabetically',
        web: 'language',
      },
    },
    {
      label: _(msg`Copy post text`),
      onPress() {
        onCopyPostText()
      },
      testID: 'postDropdownCopyTextBtn',
      icon: {
        ios: {
          name: 'doc.on.doc',
        },
        android: 'ic_menu_edit',
        web: ['far', 'paste'],
      },
    },
    {
      label: isWeb ? _(msg`Copy link to post`) : _(msg`Share`),
      onPress() {
        const url = toShareUrl(href)
        shareUrl(url)
      },
      testID: 'postDropdownShareBtn',
      icon: {
        ios: {
          name: 'square.and.arrow.up',
        },
        android: 'ic_menu_share',
        web: 'share',
      },
    },
    hasSession && {
      label: 'separator',
    },
    hasSession && {
      label: isThreadMuted ? _(msg`Unmute thread`) : _(msg`Mute thread`),
      onPress() {
        onToggleThreadMute()
      },
      testID: 'postDropdownMuteThreadBtn',
      icon: {
        ios: {
          name: 'speaker.slash',
        },
        android: 'ic_lock_silent_mode',
        web: 'comment-slash',
      },
    },
    hasSession &&
      !isAuthor &&
      !isPostHidden && {
        label: _(msg`Hide post`),
        onPress() {
          openModal({
            name: 'confirm',
            title: _(msg`Hide this post?`),
            message: _(msg`This will hide this post from your feeds.`),
            onPressConfirm: onHidePost,
          })
        },
        testID: 'postDropdownHideBtn',
        icon: {
          ios: {
            name: 'eye.slash',
          },
          android: 'ic_menu_delete',
          web: ['far', 'eye-slash'],
        },
      },
    {
      label: 'separator',
    },
    !isAuthor &&
      hasSession && {
        label: _(msg`Report post`),
        onPress() {
          openModal({
            name: 'report',
            uri: postUri,
            cid: postCid,
          })
        },
        testID: 'postDropdownReportBtn',
        icon: {
          ios: {
            name: 'exclamationmark.triangle',
          },
          android: 'ic_menu_report_image',
          web: 'circle-exclamation',
        },
      },
    isAuthor && {
      label: _(msg`Delete post`),
      onPress() {
        openModal({
          name: 'confirm',
          title: _(msg`Delete this post?`),
          message: _(msg`Are you sure? This cannot be undone.`),
          onPressConfirm: onDeletePost,
        })
      },
      testID: 'postDropdownDeleteBtn',
      icon: {
        ios: {
          name: 'trash',
        },
        android: 'ic_menu_delete',
        web: ['far', 'trash-can'],
      },
    },
    showAppealLabelItem && {
      label: 'separator',
    },
    showAppealLabelItem && {
      label: _(msg`Appeal content warning`),
      onPress() {
        openModal({name: 'appeal-label', uri: postUri, cid: postCid})
      },
      testID: 'postDropdownAppealBtn',
      icon: {
        ios: {
          name: 'exclamationmark.triangle',
        },
        android: 'ic_menu_report_image',
        web: 'circle-exclamation',
      },
    },
  ].filter(Boolean) as NativeDropdownItem[]

  return (
    <EventStopper>
      <NativeDropdown
        testID={testID}
        items={dropdownItems}
        accessibilityLabel={_(msg`More post options`)}
        accessibilityHint="">
        <View style={style}>
          <FontAwesomeIcon icon="ellipsis" size={20} color={defaultCtrlColor} />
        </View>
      </NativeDropdown>
    </EventStopper>
  )
}

PostDropdownBtn = memo(PostDropdownBtn)
export {PostDropdownBtn}

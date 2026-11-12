import {useMemo} from 'react'
import {Platform, StyleSheet, View} from 'react-native'
import * as ExpoClipboard from 'expo-clipboard'
import {AtUri} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl, simpleShareText} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {precachePost} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogContext, useDialogControl} from '#/components/Dialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {
  Bookmark_Filled_Corner0_Rounded as BookmarkFilledIcon,
  Bookmark_Stroke2_Corner0_Rounded as BookmarkIcon,
} from '#/components/icons/Bookmark'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import {type ShareContent} from '#/components/ShareDialog/catalog'
import {SHEET_GUTTER} from '#/components/ShareDialog/const'
import {type ShareAction, ShareRow} from '#/components/ShareDialog/ShareRow'
import {useInstalledSharePlatforms} from '#/components/ShareDialog/useInstalledSharePlatforms'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {IS_IOS} from '#/env'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {usePostBookmark} from '../BookmarkButton'
import {RecentChats} from './RecentChats'
import {type ShareMenuItemsProps} from './ShareMenuItems.types'

/**
 * The redesigned share sheet (APP-3670), behind `share_destinations:enable`:
 * a chat search and grid of recent chats, then a row of the apps installed on
 * the device, with Copy link, Save and More (the system share sheet) below it.
 */
export function ShareSheetItems({
  post,
  onShare: onShareProp,
  logContext,
}: ShareMenuItemsProps): React.ReactNode {
  const t = useTheme()
  const ax = useAnalytics()
  const {hasSession} = useSession()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const sendViaChatControl = useDialogControl()
  const [devModeEnabled] = useDevMode()
  const aa = useAgeAssurance()
  const queryClient = useQueryClient()

  const postUri = post.uri
  const postAuthor = useProfileShadow(post.author)
  const {isBookmarked, toggleBookmark} = usePostBookmark({
    post,
    logContext,
    entryPoint: 'ShareMenu',
  })

  const href = useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const hideInPWI = useMemo(() => {
    return !!postAuthor.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
  }, [postAuthor])

  const showChats = hasSession && aa.state.access === aa.Access.Full

  const onSharePost = () => {
    ax.metric('share:press:nativeShare', {
      uri: postUri,
      authorDid: postAuthor.did,
      entryPoint: 'ShareMenu',
      os: Platform.OS,
    })
    const url = toShareUrl(href)
    void shareUrl(url).then(result => {
      if (!result) return
      ax.metric('share:nativeShare:result', {
        uri: postUri,
        authorDid: postAuthor.did,
        entryPoint: 'ShareMenu',
        ...result,
      })
    })
    onShareProp()
  }

  const onCopyLink = async () => {
    ax.metric('share:press:copyLink', {uri: postUri})
    const url = toShareUrl(href)
    if (IS_IOS) {
      // iOS only
      await ExpoClipboard.setUrlAsync(url)
    } else {
      await ExpoClipboard.setStringAsync(url)
    }
    Toast.show(l`Copied to clipboard`, {
      type: 'success',
    })
    onShareProp()
  }

  const onBeforeShareViaChat = () => {
    precachePost(queryClient, postUri, post)
  }

  const onSelectChatToShareTo = (conversation: string) => {
    ax.metric('share:press:dmSelected', {
      uri: postUri,
      authorDid: postAuthor.did,
    })
    onBeforeShareViaChat()
    navigation.navigate('MessagesConversation', {
      conversation,
      embed: postUri,
      embedSource: 'chatSearch',
    })
  }

  const onOpenDmSearch = () => {
    ax.metric('share:press:openDmSearch', {
      uri: postUri,
      authorDid: postAuthor.did,
    })
    sendViaChatControl.open()
  }

  const actions: ShareAction[] = [
    {
      id: 'copyLink',
      label: l`Copy link`,
      icon: ChainLinkIcon,
      onPress: () => void onCopyLink(),
    },
    ...(hasSession
      ? [
          {
            id: 'save',
            label: isBookmarked
              ? l({
                  message: 'Saved',
                  comment:
                    'Share menu toggle label once the post is in saved posts; tapping again removes it',
                })
              : l({
                  message: 'Save',
                  comment:
                    'Share menu toggle that adds the post to saved posts',
                }),
            accessibilityLabel: isBookmarked
              ? l`Remove from saved posts`
              : l`Add to saved posts`,
            icon: isBookmarked ? BookmarkFilledIcon : BookmarkIcon,
            active: isBookmarked,
            stayOpen: true,
            onPress: () => void toggleBookmark(),
          },
        ]
      : []),
    {
      id: 'more',
      label: l({
        message: 'More',
        comment:
          'Share menu item that opens the system share sheet with every other way to share the post',
      }),
      accessibilityLabel: l`More ways to share`,
      icon: DotsIcon,
      onPress: onSharePost,
    },
  ]

  const content: ShareContent = {
    url: toShareUrl(href),
    title: l({
      message: `Post by @${postAuthor.handle} on Bluesky`,
      comment: 'Prefilled subject line when sharing a post to email or Reddit',
    }),
  }

  const onShareATURI = () => {
    void simpleShareText(postUri)
  }

  const onShareAuthorDID = () => {
    void simpleShareText(postAuthor.did)
  }

  return (
    <Menu.Outer>
      <View style={[a.gap_lg, a.pt_sm]}>
        {showChats && (
          <View style={[a.gap_xl]}>
            <SearchChatsButton onPress={onOpenDmSearch} />
            <RecentChats
              layout="grid"
              postUri={postUri}
              authorDid={postAuthor.did}
              onBeforePress={onBeforeShareViaChat}
            />
          </View>
        )}

        {/* Pulled up so the line sits right where the chat grid cuts off */}
        <View
          style={[
            a.gap_lg,
            showChats && {
              marginTop: -tokens.space.lg,
              paddingTop: tokens.space.sm + tokens.space.lg,
            },
          ]}>
          {showChats && (
            /*
             * A filled strip rather than a hairline border, which iOS
             * doesn't draw at some fractional positions.
             */
            <View
              style={[
                a.absolute,
                t.atoms.bg_contrast_100,
                {
                  top: 0,
                  left: SHEET_GUTTER * -1,
                  right: SHEET_GUTTER * -1,
                  height: StyleSheet.hairlineWidth,
                },
              ]}
            />
          )}
          <InstalledAppsShareRow
            // Logged-out viewers can't open these posts, so only link options show
            showApps={!hideInPWI}
            actions={actions}
            content={content}
            uri={postUri}
            authorDid={postAuthor.did}
            onShare={onShareProp}
          />

          {hideInPWI && (
            <View
              style={[
                a.flex_row,
                a.align_center,
                a.justify_center,
                a.gap_xs,
                a.pb_xs,
              ]}>
              <WarningIcon size="sm" fill={t.atoms.text.color} />
              <Text style={[a.text_sm, a.leading_snug, t.atoms.text]}>
                <Trans>This post is only visible to logged-in users.</Trans>
              </Text>
            </View>
          )}

          {devModeEnabled && (
            <Menu.Group>
              <Menu.Item
                testID="postAtUriShareBtn"
                label={l`Share post at:// URI`}
                onPress={onShareATURI}>
                <Menu.ItemText>
                  <Trans>Share post at:// URI</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
              <Menu.Item
                testID="postAuthorDIDShareBtn"
                label={l`Share author DID`}
                onPress={onShareAuthorDID}>
                <Menu.ItemText>
                  <Trans>Share author DID</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
            </Menu.Group>
          )}
        </View>
      </View>

      <StackedSendViaChatDialog
        control={sendViaChatControl}
        onSelectChat={onSelectChatToShareTo}
      />
    </Menu.Outer>
  )
}

/**
 * The share row with the installed apps filled in. Its own component so it
 * mounts with the sheet, which checks the installed apps again on every open.
 */
function InstalledAppsShareRow({
  showApps,
  ...props
}: {showApps: boolean} & Omit<
  React.ComponentProps<typeof ShareRow>,
  'platformIds'
>) {
  const installed = useInstalledSharePlatforms({enabled: showApps})
  return <ShareRow platformIds={(showApps && installed) || []} {...props} />
}

/**
 * Looks like a search field, but opens the full "Send via chat" sheet on top
 * of the share sheet, which does the searching.
 */
function SearchChatsButton({onPress}: {onPress: () => void}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Button
      testID="postDropdownSendViaDMBtn"
      label={l`Search chats`}
      accessibilityHint={l`Opens a list of people and chats to send the post to`}
      onPress={onPress}>
      {({pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            a.px_md,
            pressed ? t.atoms.bg_contrast_100 : t.atoms.bg_contrast_50,
            {height: 44, borderRadius: 10},
          ]}>
          <MagnifyingGlassIcon
            size="md"
            fill={t.atoms.text_contrast_low.color}
          />
          <Text style={[a.text_md, t.atoms.text_contrast_low]}>
            <Trans>Search chats</Trans>
          </Text>
        </View>
      )}
    </Button>
  )
}

/**
 * The "Send via chat" sheet, rendered inside the share sheet so it opens
 * stacked on top of it instead of replacing it. Picking a chat closes both
 * sheets before moving on.
 */
function StackedSendViaChatDialog({
  control,
  onSelectChat,
}: {
  control: React.ComponentProps<typeof SendViaChatDialog>['control']
  onSelectChat: (conversation: string) => void
}) {
  const sheetControl = useDialogContext()

  return (
    <SendViaChatDialog
      control={control}
      onSelectChat={conversation =>
        sheetControl.close(() => onSelectChat(conversation))
      }
    />
  )
}

import {memo, useMemo} from 'react'
import * as ExpoClipboard from 'expo-clipboard'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {makeProfileLink} from '#/lib/routes/links'
import {type NavigationProp} from '#/lib/routes/types'
import {shareText, shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useDialogControl} from '#/components/Dialog'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon} from '#/components/icons/ArrowOutOfBox'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {PaperPlane_Stroke2_Corner0_Rounded as PaperPlaneIcon} from '#/components/icons/PaperPlane'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {RecentChats} from './RecentChats'
import {type ShareMenuItemsProps} from './ShareMenuItems.types'

let ShareMenuItems = ({
  post,
  onShare: onShareProp,
}: ShareMenuItemsProps): React.ReactNode => {
  const {hasSession, currentAccount} = useSession()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const pwiWarningShareControl = useDialogControl()
  const pwiWarningCopyControl = useDialogControl()
  const sendViaChatControl = useDialogControl()
  const [devModeEnabled] = useDevMode()

  const postUri = post.uri
  const postAuthor = useProfileShadow(post.author)

  const href = useMemo(() => {
    const urip = new AtUri(postUri)
    return makeProfileLink(postAuthor, 'post', urip.rkey)
  }, [postUri, postAuthor])

  const hideInPWI = useMemo(() => {
    return !!postAuthor.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
  }, [postAuthor])

  const showLoggedOutWarning =
    postAuthor.did !== currentAccount?.did && hideInPWI

  const onSharePost = () => {
    logger.metric('share:press:nativeShare', {}, {statsig: true})
    const url = toShareUrl(href)
    shareUrl(url)
    onShareProp()
  }

  const onCopyLink = () => {
    logger.metric('share:press:copyLink', {}, {statsig: true})
    const url = toShareUrl(href)
    ExpoClipboard.setUrlAsync(url).then(() =>
      Toast.show(_(msg`Copied to clipboard`), 'clipboard-check'),
    )
    onShareProp()
  }

  const onSelectChatToShareTo = (conversation: string) => {
    navigation.navigate('MessagesConversation', {
      conversation,
      embed: postUri,
    })
  }

  const onShareATURI = () => {
    shareText(postUri)
  }

  const onShareAuthorDID = () => {
    shareText(postAuthor.did)
  }

  return (
    <>
      <Menu.Outer>
        {hasSession && (
          <Menu.Group>
            <Menu.ContainerItem>
              <RecentChats postUri={postUri} />
            </Menu.ContainerItem>
            <Menu.Item
              testID="postDropdownSendViaDMBtn"
              label={_(msg`Send via direct message`)}
              onPress={() => {
                logger.metric('share:press:openDmSearch', {}, {statsig: true})
                sendViaChatControl.open()
              }}>
              <Menu.ItemText>
                <Trans>Send via direct message</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={PaperPlaneIcon} position="right" />
            </Menu.Item>
          </Menu.Group>
        )}

        <Menu.Group>
          <Menu.Item
            testID="postDropdownShareBtn"
            label={_(msg`Share via...`)}
            onPress={() => {
              if (showLoggedOutWarning) {
                pwiWarningShareControl.open()
              } else {
                onSharePost()
              }
            }}>
            <Menu.ItemText>
              <Trans>Share via...</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ArrowOutOfBoxIcon} position="right" />
          </Menu.Item>

          <Menu.Item
            testID="postDropdownShareBtn"
            label={_(msg`Copy link to post`)}
            onPress={() => {
              if (showLoggedOutWarning) {
                pwiWarningCopyControl.open()
              } else {
                onCopyLink()
              }
            }}>
            <Menu.ItemText>
              <Trans>Copy link to post</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ChainLinkIcon} position="right" />
          </Menu.Item>
        </Menu.Group>

        {devModeEnabled && (
          <Menu.Group>
            <Menu.Item
              testID="postAtUriShareBtn"
              label={_(msg`Share post at:// URI`)}
              onPress={onShareATURI}>
              <Menu.ItemText>
                <Trans>Share post at:// URI</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={ClipboardIcon} position="right" />
            </Menu.Item>
            <Menu.Item
              testID="postAuthorDIDShareBtn"
              label={_(msg`Share author DID`)}
              onPress={onShareAuthorDID}>
              <Menu.ItemText>
                <Trans>Share author DID</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={ClipboardIcon} position="right" />
            </Menu.Item>
          </Menu.Group>
        )}
      </Menu.Outer>

      <Prompt.Basic
        control={pwiWarningShareControl}
        title={_(msg`Note about sharing`)}
        description={_(
          msg`This post is only visible to logged-in users. It won't be visible to people who aren't signed in.`,
        )}
        onConfirm={onSharePost}
        confirmButtonCta={_(msg`Share anyway`)}
      />

      <Prompt.Basic
        control={pwiWarningCopyControl}
        title={_(msg`Note about sharing`)}
        description={_(
          msg`This post is only visible to logged-in users. It won't be visible to people who aren't signed in.`,
        )}
        onConfirm={onCopyLink}
        confirmButtonCta={_(msg`Copy anyway`)}
      />

      <SendViaChatDialog
        control={sendViaChatControl}
        onSelectChat={onSelectChatToShareTo}
      />
    </>
  )
}
ShareMenuItems = memo(ShareMenuItems)
export {ShareMenuItems}

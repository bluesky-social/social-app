import {memo, useCallback, useMemo} from 'react'
import {AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {makeProfileLink} from '#/lib/routes/links'
import {NavigationProp} from '#/lib/routes/types'
import {shareText, shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {isWeb} from '#/platform/detection'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useDevModeEnabled} from '#/state/preferences/dev-mode'
import {useSession} from '#/state/session'
import {useBreakpoints} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {EmbedDialog} from '#/components/dialogs/Embed'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {CodeBrackets_Stroke2_Corner0_Rounded as CodeBracketsIcon} from '#/components/icons/CodeBrackets'
import {PaperPlane_Stroke2_Corner0_Rounded as Send} from '#/components/icons/PaperPlane'
import * as Menu from '#/components/Menu'
import * as Prompt from '#/components/Prompt'
import {ShareMenuItemsProps} from './ShareMenuItems.types'

let ShareMenuItems = ({
  post,
  record,
  timestamp,
  onShare: onShareProp,
}: ShareMenuItemsProps): React.ReactNode => {
  const {hasSession, currentAccount} = useSession()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const loggedOutWarningPromptControl = useDialogControl()
  const embedPostControl = useDialogControl()
  const sendViaChatControl = useDialogControl()
  const [devModeEnabled] = useDevModeEnabled()

  const postUri = post.uri
  const postCid = post.cid
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

  const onSharePost = useCallback(() => {
    const url = toShareUrl(href)
    shareUrl(url)
    onShareProp()
  }, [href, onShareProp])

  const onSelectChatToShareTo = useCallback(
    (conversation: string) => {
      navigation.navigate('MessagesConversation', {
        conversation,
        embed: postUri,
      })
    },
    [navigation, postUri],
  )

  const canEmbed = isWeb && gtMobile && !hideInPWI

  const onShareATURI = useCallback(() => {
    shareText(postUri)
  }, [postUri])

  const onShareAuthorDID = useCallback(() => {
    shareText(postAuthor.did)
  }, [postAuthor.did])

  return (
    <>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item
            testID="postDropdownShareBtn"
            label={_(msg`Copy link to post`)}
            onPress={() => {
              if (showLoggedOutWarning) {
                loggedOutWarningPromptControl.open()
              } else {
                onSharePost()
              }
            }}>
            <Menu.ItemText>
              <Trans>Copy link to post</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ChainLinkIcon} position="right" />
          </Menu.Item>

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

          {canEmbed && (
            <Menu.Item
              testID="postDropdownEmbedBtn"
              label={_(msg`Embed post`)}
              onPress={() => embedPostControl.open()}>
              <Menu.ItemText>{_(msg`Embed post`)}</Menu.ItemText>
              <Menu.ItemIcon icon={CodeBracketsIcon} position="right" />
            </Menu.Item>
          )}
        </Menu.Group>

        {devModeEnabled && (
          <>
            <Menu.Divider />
            <Menu.Group>
              <Menu.Item
                testID="postAtUriShareBtn"
                label={_(msg`Copy post at:// URI`)}
                onPress={onShareATURI}>
                <Menu.ItemText>
                  <Trans>Copy post at:// URI</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
              <Menu.Item
                testID="postAuthorDIDShareBtn"
                label={_(msg`Copy author DID`)}
                onPress={onShareAuthorDID}>
                <Menu.ItemText>
                  <Trans>Copy author DID</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon icon={ClipboardIcon} position="right" />
              </Menu.Item>
            </Menu.Group>
          </>
        )}
      </Menu.Outer>

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
    </>
  )
}
ShareMenuItems = memo(ShareMenuItems)
export {ShareMenuItems}

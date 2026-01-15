import {memo, useMemo} from 'react'
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
import {useBreakpoints} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {EmbedDialog} from '#/components/dialogs/Embed'
import {SendViaChatDialog} from '#/components/dms/dialogs/ShareViaChatDialog'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {CodeBrackets_Stroke2_Corner0_Rounded as CodeBracketsIcon} from '#/components/icons/CodeBrackets'
import {PaperPlane_Stroke2_Corner0_Rounded as Send} from '#/components/icons/PaperPlane'
import * as Menu from '#/components/Menu'
import {useAgeAssurance} from '#/ageAssurance'
import {IS_WEB} from '#/env'
import {useDevMode} from '#/storage/hooks/dev-mode'
import {type ShareMenuItemsProps} from './ShareMenuItems.types'

let ShareMenuItems = ({
  post,
  record,
  timestamp,
  onShare: onShareProp,
}: ShareMenuItemsProps): React.ReactNode => {
  const {hasSession} = useSession()
  const {gtMobile} = useBreakpoints()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const embedPostControl = useDialogControl()
  const sendViaChatControl = useDialogControl()
  const [devModeEnabled] = useDevMode()
  const aa = useAgeAssurance()

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

  const onCopyLink = () => {
    logger.metric('share:press:copyLink', {}, {statsig: true})
    const url = toShareUrl(href)
    shareUrl(url)
    onShareProp()
  }

  const onSelectChatToShareTo = (conversation: string) => {
    logger.metric('share:press:dmSelected', {}, {statsig: true})
    navigation.navigate('MessagesConversation', {
      conversation,
      embed: postUri,
    })
  }

  const canEmbed = IS_WEB && gtMobile && !hideInPWI

  const onShareATURI = () => {
    shareText(postUri)
  }

  const onShareAuthorDID = () => {
    shareText(postAuthor.did)
  }

  const copyLinkItem = (
    <Menu.Item
      testID="postDropdownShareBtn"
      label={_(msg`Copy link to post`)}
      onPress={onCopyLink}>
      <Menu.ItemText>
        <Trans>Copy link to post</Trans>
      </Menu.ItemText>
      <Menu.ItemIcon icon={ChainLinkIcon} position="right" />
    </Menu.Item>
  )

  return (
    <>
      <Menu.Outer>
        {!hideInPWI && copyLinkItem}

        {hasSession && aa.state.access === aa.Access.Full && (
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
            <Menu.ItemIcon icon={Send} position="right" />
          </Menu.Item>
        )}

        {canEmbed && (
          <Menu.Item
            testID="postDropdownEmbedBtn"
            label={_(msg`Embed post`)}
            onPress={() => {
              logger.metric('share:press:embed', {}, {statsig: true})
              embedPostControl.open()
            }}>
            <Menu.ItemText>{_(msg`Embed post`)}</Menu.ItemText>
            <Menu.ItemIcon icon={CodeBracketsIcon} position="right" />
          </Menu.Item>
        )}

        {hideInPWI && (
          <>
            {hasSession && <Menu.Divider />}
            {copyLinkItem}
            <Menu.LabelText style={{maxWidth: 220}}>
              <Trans>Note: This post is only visible to logged-in users.</Trans>
            </Menu.LabelText>
          </>
        )}

        {devModeEnabled && (
          <>
            <Menu.Divider />
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
          </>
        )}
      </Menu.Outer>

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

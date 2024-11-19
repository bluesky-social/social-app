import {View} from 'react-native'
import {ModerationCause} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
import {makeProfileLink} from '#/lib/routes/links'
import {listUriToHref} from '#/lib/strings/url-helpers'
import {isNative} from '#/platform/detection'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {InlineLinkText} from '#/components/Link'
import {AppModerationCause} from '#/components/Pills'
import {Text} from '#/components/Typography'

export {useDialogControl as useModerationDetailsDialogControl} from '#/components/Dialog'

export interface ModerationDetailsDialogProps {
  control: Dialog.DialogOuterProps['control']
  modcause?: ModerationCause | AppModerationCause
}

export function ModerationDetailsDialog(props: ModerationDetailsDialogProps) {
  return (
    <Dialog.Outer control={props.control}>
      <Dialog.Handle />
      <ModerationDetailsDialogInner {...props} />
    </Dialog.Outer>
  )
}

function ModerationDetailsDialogInner({
  modcause,
  control,
}: ModerationDetailsDialogProps & {
  control: Dialog.DialogOuterProps['control']
}) {
  const t = useTheme()
  const {_} = useLingui()
  const desc = useModerationCauseDescription(modcause)
  const {currentAccount} = useSession()

  let name
  let description
  if (!modcause) {
    name = _(msg`Content Warning`)
    description = _(
      msg`Moderator has chosen to set a general warning on the content.`,
    )
  } else if (modcause.type === 'blocking') {
    if (modcause.source.type === 'list') {
      const list = modcause.source.list
      name = _(msg`User Blocked by List`)
      description = (
        <Trans>
          This user is included in the{' '}
          <InlineLinkText
            label={list.name}
            to={listUriToHref(list.uri)}
            style={[a.text_sm]}>
            {list.name}
          </InlineLinkText>{' '}
          list which you have blocked.
        </Trans>
      )
    } else {
      name = _(msg`User Blocked`)
      description = _(
        msg`You have blocked this user. You cannot view their content.`,
      )
    }
  } else if (modcause.type === 'blocked-by') {
    name = _(msg`User Blocks You`)
    description = _(
      msg`This user has blocked you. You cannot view their content.`,
    )
  } else if (modcause.type === 'block-other') {
    name = _(msg`Content Not Available`)
    description = _(
      msg`This content is not available because one of the users involved has blocked the other.`,
    )
  } else if (modcause.type === 'muted') {
    if (modcause.source.type === 'list') {
      const list = modcause.source.list
      name = _(msg`Account Muted by List`)
      description = (
        <Trans>
          This user is included in the{' '}
          <InlineLinkText
            label={list.name}
            to={listUriToHref(list.uri)}
            style={[a.text_sm]}>
            {list.name}
          </InlineLinkText>{' '}
          list which you have muted.
        </Trans>
      )
    } else {
      name = _(msg`Account Muted`)
      description = _(msg`You have muted this account.`)
    }
  } else if (modcause.type === 'mute-word') {
    name = _(msg`Post Hidden by Muted Word`)
    description = _(msg`You've chosen to hide a word or tag within this post.`)
  } else if (modcause.type === 'hidden') {
    name = _(msg`Post Hidden by You`)
    description = _(msg`You have hidden this post.`)
  } else if (modcause.type === 'reply-hidden') {
    const isYou = currentAccount?.did === modcause.source.did
    name = isYou
      ? _(msg`Reply Hidden by You`)
      : _(msg`Reply Hidden by Thread Author`)
    description = isYou
      ? _(msg`You hid this reply.`)
      : _(msg`The author of this thread has hidden this reply.`)
  } else if (modcause.type === 'label') {
    name = desc.name
    description = (
      <Text emoji style={[t.atoms.text, a.text_md, a.leading_snug]}>
        {desc.description}
      </Text>
    )
  } else {
    // should never happen
    name = ''
    description = ''
  }

  return (
    <Dialog.ScrollableInner label={_(msg`Moderation details`)}>
      <Text emoji style={[t.atoms.text, a.text_2xl, a.font_bold, a.mb_sm]}>
        {name}
      </Text>
      <Text style={[t.atoms.text, a.text_md, a.leading_snug]}>
        {description}
      </Text>

      {modcause?.type === 'label' && (
        <View style={[a.pt_lg]}>
          <Divider />
          {modcause.source.type === 'user' ? (
            <Text style={[t.atoms.text, a.text_md, a.leading_snug, a.mt_lg]}>
              <Trans>This label was applied by the author.</Trans>
            </Text>
          ) : (
            <>
              <Text style={[t.atoms.text, a.text_md, a.leading_snug, a.mt_lg]}>
                <Trans>
                  This label was applied by{' '}
                  <InlineLinkText
                    label={desc.source || _(msg`an unknown labeler`)}
                    to={makeProfileLink({did: modcause.label.src, handle: ''})}
                    onPress={() => control.close()}
                    style={a.text_md}>
                    {desc.source || _(msg`an unknown labeler`)}
                  </InlineLinkText>
                  .
                </Trans>
              </Text>
            </>
          )}
        </View>
      )}

      {isNative && <View style={{height: 40}} />}

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

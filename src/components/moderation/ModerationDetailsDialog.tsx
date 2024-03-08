import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ModerationCause} from '@atproto/api'

import {listUriToHref} from '#/lib/strings/url-helpers'
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'

import {useTheme, atoms as a, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {Button} from '#/components/Button'
import {InlineLink} from '#/components/Link'
import {makeProfileLink} from '#/lib/routes/links'

export {useDialogControl as useModerationDetailsDialogControl} from '#/components/Dialog'

export interface ModerationDetailsDialogProps {
  control: Dialog.DialogOuterProps['control']
  modcause: ModerationCause
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
  const {gtMobile} = useBreakpoints()

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
          <InlineLink to={listUriToHref(list.uri)} style={[a.text_sm]}>
            {list.name}
          </InlineLink>{' '}
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
          <InlineLink to={listUriToHref(list.uri)} style={[a.text_sm]}>
            {list.name}
          </InlineLink>{' '}
          list which you have muted.
        </Trans>
      )
    } else {
      name = _(msg`Account Muted`)
      description = _(msg`You have muted this user.`)
    }
    // TODO
    // } else if (cause.type === 'muted-word') {
    //   return {
    //     icon: EyeSlash,
    //     name: _(msg`Post hidden by muted word`),
    //     description: _(
    //       msg`You've chosen to hide a word or tag within this post.`,
    //     ),
    //   }
  } else if (modcause.type === 'label') {
    name = desc.name
    description = desc.description
  } else {
    // should never happen
    name = ''
    description = ''
  }

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title">
      <Text
        nativeID="dialog-title"
        style={[t.atoms.text, a.text_2xl, a.font_bold, a.mb_md]}>
        {name}
      </Text>
      <Text
        nativeID="dialog-description"
        style={[t.atoms.text, a.text_md, a.mb_md]}>
        {description}
      </Text>
      {modcause.type === 'label' && (
        <View
          style={[
            t.atoms.bg_contrast_50,
            a.mb_md,
            a.px_lg,
            a.py_lg,
            a.rounded_sm,
          ]}>
          <Text style={[t.atoms.text, a.text_sm, a.leading_snug]}>
            <Trans>
              This label was applied by{' '}
              <InlineLink
                to={makeProfileLink({did: modcause.label.src, handle: ''})}
                onPress={() => control.close()}>
                {desc.source}
              </InlineLink>
              .
            </Trans>
          </Text>
        </View>
      )}
      <View style={gtMobile && [a.flex_row, a.justify_end]}>
        <Button
          testID="doneBtn"
          variant="outline"
          color="primary"
          size="small"
          onPress={() => control.close()}
          label={_(msg`Done`)}>
          {_(msg`Done`)}
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}

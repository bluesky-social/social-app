import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ModerationCause} from '@atproto/api'

import {atoms as a, useBreakpoints} from '#/alf'
import {Text} from '#/components/Typography'
import * as Dialog from '#/components/Dialog'
import {GlobalDialogProps} from '#/components/dialogs'
import {Button} from '#/components/Button'
import {InlineLink} from '#/components/Link'
import {useLabelStrings} from '#/lib/moderation/useLabelStrings'
import {listUriToHref} from '#/lib/strings/url-helpers'

export interface ModerationDetailsDialogProps {
  context: 'account' | 'content'
  modcause: ModerationCause
}

export function ModerationDetailsDialog({
  params,
  cleanup,
}: GlobalDialogProps<ModerationDetailsDialogProps>) {
  const {_} = useLingui()
  const labelStrings = useLabelStrings()
  const control = Dialog.useDialogControl()
  const {gtMobile} = useBreakpoints()
  const {context, modcause} = params

  // REQUIRED CLEANUP
  const onClose = React.useCallback(() => cleanup(), [cleanup])

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
  } else if (modcause.type === 'label') {
    if (modcause.labelDef.id in labelStrings) {
      name = labelStrings[modcause.labelDef.id][context].name
      description = labelStrings[modcause.labelDef.id][context].description
    } else {
      name = modcause.labelDef.id
      description = _(msg`Labeled ${modcause.labelDef.id}`)
    }
  } else {
    // should never happen
    name = ''
    description = ''
  }

  return (
    <Dialog.Outer defaultOpen control={control} onClose={onClose}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title">
        <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
          {name}
        </Text>
        <Text nativeID="dialog-description" style={[a.text_sm]}>
          {description}
        </Text>
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
    </Dialog.Outer>
  )
}

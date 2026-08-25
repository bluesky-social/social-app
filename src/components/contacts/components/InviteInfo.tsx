import {type StyleProp, type TextStyle} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {HITSLOP_20} from '#/lib/constants'
import {android, atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CircleInfo_Stroke2_Corner0_Rounded as InfoIcon} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'

export function InviteInfo({
  iconStyle,
  iconOffset = 0,
}: {
  iconStyle: StyleProp<TextStyle>
  /**
   * Adjust the vertical position of the icon via `translateY`
   *
   * @platform android
   */
  iconOffset?: number
}) {
  const {_} = useLingui()
  const control = Dialog.useDialogControl()

  const style = [a.text_md, a.leading_snug, a.mt_xs]

  return (
    <>
      <Button
        label={_(msg`Learn more about how inviting friends works`)}
        onPress={control.open}
        hitSlop={HITSLOP_20}
        style={android({transform: [{translateY: iconOffset}]})}>
        <InfoIcon style={iconStyle} size="sm" />
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <Dialog.ScrollableInner label={_(msg`Invite Friends`)}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Invite Friends</Trans>
          </Text>
          <Text style={style}>
            <Trans>
              It looks like some of your contacts have not tried to find you
              here yet. You can personally invite them by customizing a draft
              message we will provide.
            </Trans>
          </Text>
          <Text style={[style, a.font_medium, a.mt_lg]}>
            <Trans>How it works:</Trans>
          </Text>
          <Text style={style}>
            &bull; <Trans>Choose who to invite</Trans>
          </Text>
          <Text style={style}>
            &bull; <Trans>Personalize the message</Trans>
          </Text>
          <Text style={style}>
            &bull; <Trans>Send the message from your phone</Trans>
          </Text>
          <Text style={style}>
            &bull;{' '}
            <Trans>
              We don't store your friends' phone numbers or send any messages
            </Trans>
          </Text>

          <Button
            label={_(msg`Done`)}
            onPress={() => control.close()}
            size="large"
            color="primary"
            style={[a.mt_2xl]}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}

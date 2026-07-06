import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

/**
 * Confirmation gate shown before signing in to an auto-detected third-party
 * hosting provider. When a typed handle resolves to a non-Bluesky PDS, this
 * dialog exists to prevent typosquatting credential capture: it makes the user
 * explicitly acknowledge that their password will be sent to that server before
 * we send it, rather than silently trusting whatever host detection returned.
 */
export function ConfirmHostingProviderDialog({
  control,
  host,
  identifier,
  onConfirm,
}: {
  control: Dialog.DialogOuterProps['control']
  /** The display host of the resolved PDS, e.g. `example.com`. */
  host: string
  /** The full handle (or DID) being signed in. */
  identifier: string
  onConfirm: () => void
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogInner host={host} identifier={identifier} onConfirm={onConfirm} />
    </Dialog.Outer>
  )
}

function DialogInner({
  host,
  identifier,
  onConfirm,
}: {
  host: string
  identifier: string
  onConfirm: () => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()

  /*
   * Handles are displayed with an `@` prefix; DIDs are shown verbatim. Emails
   * never reach this dialog - they resolve to the default (Bluesky-hosted)
   * service. Applied to the interpolated value rather than as literal text
   * inside <Trans> so the prefix wraps together with the handle.
   */
  const displayIdentifier = identifier.startsWith('did:')
    ? identifier
    : `@${identifier}`

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title"
      style={web([{maxWidth: 400, borderRadius: 36}])}>
      <View style={[a.relative, a.gap_md, a.w_full]}>
        <Text
          nativeID="dialog-title"
          style={[a.text_2xl, a.font_bold, a.pr_5xl]}>
          <Trans>Continue with {host}?</Trans>
        </Text>

        <Text nativeID="dialog-description" style={[a.text_md]}>
          <Trans>
            <Text emoji style={[a.text_md, a.font_bold]}>
              {displayIdentifier}
            </Text>{' '}
            is hosted by <Text style={[a.text_md, a.font_bold]}>{host}</Text>.
            Your password will be sent to{' '}
            <Text style={[a.text_md, a.font_bold]}>{host}</Text> to sign you in.
          </Trans>
        </Text>

        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          <Trans>
            If you don’t recognize this provider, go back and double-check your
            username.
          </Trans>
        </Text>

        <Button
          color="primary"
          size="large"
          onPress={() => control.close(() => onConfirm())}
          label={l`Continue`}
          accessibilityHint={l`Sends your password to the hosting provider and signs in`}>
          <ButtonText>
            <Trans>Continue</Trans>
          </ButtonText>
        </Button>

        <Button
          color="secondary"
          size="large"
          onPress={() => control.close()}
          label={l`Go back`}
          accessibilityHint={l`Cancels signing in so you can check your username`}>
          <ButtonText>
            <Trans>Go back</Trans>
          </ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

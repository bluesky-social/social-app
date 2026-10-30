import {Fragment} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Key_Stroke2_Corner2_Rounded as KeyIcon} from '#/components/icons/Key'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
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
  passwordLength,
  onConfirm,
}: {
  control: Dialog.DialogOuterProps['control']
  /** The display host of the resolved PDS, e.g. `example.com`. */
  host: string
  /** The full handle (or DID) being signed in. */
  identifier: string
  /**
   * The length of the typed password, used to render a masked placeholder in
   * the summary card. The password itself is deliberately never passed in.
   */
  passwordLength: number
  onConfirm: () => void
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner
        host={host}
        identifier={identifier}
        passwordLength={passwordLength}
        onConfirm={onConfirm}
      />
    </Dialog.Outer>
  )
}

function DialogInner({
  host,
  identifier,
  passwordLength,
  onConfirm,
}: {
  host: string
  identifier: string
  passwordLength: number
  onConfirm: () => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title"
      style={web([{maxWidth: 400, borderRadius: 36}])}>
      <View style={[a.relative, a.gap_md, a.w_full]}>
        <Text
          nativeID="dialog-title"
          style={[a.text_2xl, a.font_bold, a.pr_5xl]}>
          <Trans>Everything look right?</Trans>
        </Text>

        <Text nativeID="dialog-description" style={[a.text_md, a.leading_snug]}>
          <Trans>
            Your username and password will be shared with{' '}
            <Text style={[a.text_md, a.leading_snug, a.font_bold]}>{host}</Text>
            . If you don’t recognize this provider, double-check your username.
          </Trans>
        </Text>

        <View
          style={[
            a.rounded_md,
            a.border,
            t.atoms.border_contrast_medium,
            a.overflow_hidden,
          ]}>
          {[
            {
              type: 'host',
              icon: GlobeIcon,
              value: host,
            },
            {
              type: 'identifier',
              icon: PersonIcon,
              value: identifier,
            },
            {
              type: 'password',
              icon: KeyIcon,
              value: '•'.repeat(passwordLength),
            },
          ].map((c, i) => (
            <Fragment key={c.type}>
              {i !== 0 && (
                <View style={[a.border_t, t.atoms.border_contrast_medium]} />
              )}
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.gap_sm,
                  a.px_md,
                  t.atoms.bg_contrast_25,
                  {paddingVertical: 10},
                ]}>
                <c.icon
                  size="sm"
                  style={[t.atoms.text_contrast_low, native(a.mt_2xs)]}
                />
                <Text
                  numberOfLines={1}
                  style={[t.atoms.text_contrast_high, a.flex_1, a.text_sm]}>
                  {c.value}
                </Text>
              </View>
            </Fragment>
          ))}
        </View>

        <Text style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          <Trans>
            This is just a one-time security check, since we haven't seen this
            account on this device before.
          </Trans>
        </Text>

        <Button
          color="primary"
          size="large"
          onPress={() => control.close(() => onConfirm())}
          label={l`Continue`}
          accessibilityHint={l`Continue signing in`}>
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

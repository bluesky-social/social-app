import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {getLinkMeta} from '#/lib/link-meta/link-meta'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useSupportPalette} from '../palette'
import {useMySupportLink} from '../storage'
import {SupportLinkField, validateSupportUri} from './SupportLinkField'

/**
 * The one place a creator adds, changes or removes their Support button.
 * Reached from Edit Profile and from tapping your own button on your profile.
 */
export function SupportLinkDialog({
  control,
  initialUri,
  onSaved,
  onRemoved,
}: {
  control: Dialog.DialogControlProps
  /** Prefill, e.g. a provider URL we spotted in the bio. */
  initialUri?: string
  onSaved?: (uri: string) => void
  /** Fires after the sheet closes when the link was removed. */
  onRemoved?: () => void
}) {
  return (
    <Dialog.Outer control={control} webOptions={{alignCenter: true}}>
      <Dialog.Handle />
      <SupportLinkDialogInner
        initialUri={initialUri}
        onSaved={onSaved}
        onRemoved={onRemoved}
      />
    </Dialog.Outer>
  )
}

function SupportLinkDialogInner({
  initialUri,
  onSaved,
  onRemoved,
}: {
  initialUri?: string
  onSaved?: (uri: string) => void
  /** Fires after the sheet closes when the link was removed. */
  onRemoved?: () => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()
  const palette = useSupportPalette()
  const {link, save, remove} = useMySupportLink()

  const startingValue = link?.uri ?? initialUri ?? ''
  const [input, setInput] = useState(startingValue)
  /*
   * We ask the link preview service whether the page actually exists before
   * saving. Some providers block scrapers (Cash App does), so a failed check
   * is a warning, not a wall: pressing Save again saves anyway.
   */
  const [reachability, setReachability] = useState<
    'unchecked' | 'checking' | 'unreachable'
  >('unchecked')
  /*
   * Typing "ko-fi" is invalid until the ".com" lands, so flagging bad input
   * live would flash red on every keystroke. Instead Save stays tappable and
   * pressing it surfaces the error.
   */
  const [showInvalid, setShowInvalid] = useState(false)
  const onChangeText = (value: string) => {
    setInput(value)
    setReachability('unchecked')
    setShowInvalid(false)
  }
  const validation = validateSupportUri(input)
  const isEditing = !!link
  /*
   * Saving needs a real URL that actually differs from what's stored.
   * Re-saving the same link is a no-op, so the button stays disabled until the
   * person changes something.
   */
  const isUnchanged =
    !!validation.normalized && validation.normalized === link?.uri
  const canSave =
    !validation.isEmpty && !isUnchanged && reachability !== 'checking'

  const onSave = () => {
    void saveLink()
  }

  const saveLink = async () => {
    if (!canSave) return
    if (!validation.normalized) {
      setShowInvalid(true)
      return
    }
    const uri = validation.normalized
    if (reachability === 'unchecked') {
      setReachability('checking')
      const meta = await getLinkMeta(uri, 8e3)
      if (meta.error) {
        setReachability('unreachable')
        return
      }
    }
    save(uri)
    control.close(() => {
      Toast.show(
        isEditing ? l`Support button updated` : l`Support button added`,
      )
      onSaved?.(uri)
    })
  }

  const onRemove = () => {
    remove()
    control.close(() => {
      Toast.show(l`Support button removed`)
      onRemoved?.()
    })
  }

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 480})}
      label={isEditing ? l`Edit your Support button` : l`Add a Support button`}>
      <View style={[a.gap_2xl, {marginTop: 8}]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl, a.leading_tight]}>
            {isEditing ? (
              <Trans>Your Support button</Trans>
            ) : (
              <Trans>Add a Support button</Trans>
            )}
          </Text>
          <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>
              Paste a link to where you already take payments. People tap
              Support on your profile and posts and land there.
            </Trans>
          </Text>
        </View>

        <SupportLinkField
          testID="supportLinkInput"
          label={l`Your payment link`}
          defaultValue={startingValue}
          onChangeText={onChangeText}
          validation={validation}
          onSubmitEditing={onSave}
          errorText={
            showInvalid
              ? l`That doesn’t look like a link. Try something like patreon.com/yourname.`
              : reachability === 'unreachable'
                ? l`We couldn’t reach this link. Check it, or save anyway.`
                : undefined
          }
        />

        <View style={[a.gap_sm]}>
          <Button
            testID="supportLinkSaveBtn"
            label={
              reachability === 'unreachable'
                ? l`Save anyway`
                : isEditing
                  ? l`Save changes`
                  : l`Add Support button`
            }
            onPress={onSave}
            disabled={!canSave}
            size="large"
            color="primary"
            style={[{backgroundColor: palette.bg}, !canSave && {opacity: 0.5}]}
            hoverStyle={{backgroundColor: palette.bgHover}}>
            <ButtonText>
              {reachability === 'unreachable' ? (
                <Trans>Save anyway</Trans>
              ) : isEditing ? (
                <Trans>Save changes</Trans>
              ) : (
                <Trans>Add Support button</Trans>
              )}
            </ButtonText>
            {reachability === 'checking' && <ButtonIcon icon={Loader} />}
          </Button>
          {isEditing ? (
            <Button
              label={l`Remove support button`}
              onPress={onRemove}
              size="large"
              variant="ghost"
              color="negative">
              <ButtonText style={[a.text_md, {color: t.palette.negative_500}]}>
                <Trans>Remove support button</Trans>
              </ButtonText>
            </Button>
          ) : (
            <Button
              label={l`Cancel`}
              onPress={() => control.close()}
              size="large"
              variant="ghost"
              color="secondary">
              <ButtonText>
                <Trans>Cancel</Trans>
              </ButtonText>
            </Button>
          )}
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

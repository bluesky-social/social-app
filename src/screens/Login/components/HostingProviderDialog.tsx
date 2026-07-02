import {useCallback, useImperativeHandle, useRef, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import * as persisted from '#/state/persisted'
import {atoms as a, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

type SegmentedControlOptions = 'automatic' | 'manual'

/**
 * Login-specific fork of the server-input dialog. Instead of picking between
 * "Bluesky" and a custom URL, the user chooses between "Automatic" (the PDS is
 * autodetected from the typed identifier) and "Manual" (an explicit PDS URL).
 *
 * Selecting Automatic clears any manual override; selecting Manual with a
 * non-empty address sets it. A Manual selection with an empty address is
 * treated as Automatic.
 */
export function HostingProviderDialog({
  control,
  currentOverride,
  isEmail,
  onSelectManual,
  onSelectAutomatic,
}: {
  control: Dialog.DialogOuterProps['control']
  /**
   * The PDS URL currently forced by a manual override, or `null` when
   * detection is automatic. Determines which tab the dialog opens on.
   */
  currentOverride: string | null
  /**
   * Whether the typed identifier is an email address. Emails cannot resolve
   * to a PDS, so the Automatic tab explains that detection is unavailable and
   * the default service will be used instead.
   */
  isEmail: boolean
  onSelectManual: (url: string) => void
  onSelectAutomatic: () => void
}) {
  const ax = useAnalytics()
  const formRef = useRef<DialogInnerRef>(null)

  // persist these options between dialog open/close
  const [fixedOption, setFixedOption] = useState<SegmentedControlOptions>(
    currentOverride ? 'manual' : 'automatic',
  )
  const [previousCustomAddress, setPreviousCustomAddress] = useState(
    currentOverride ?? '',
  )

  const onClose = useCallback(() => {
    const result = formRef.current?.getFormState()
    const nextOverride = result ?? null
    if (nextOverride) {
      onSelectManual(nextOverride)
      setPreviousCustomAddress(nextOverride)
    } else {
      onSelectAutomatic()
    }
    ax.metric('signin:hostingProviderPressed', {
      hostingProviderDidChange: nextOverride !== currentOverride,
    })
  }, [ax, onSelectManual, onSelectAutomatic, currentOverride])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner
        formRef={formRef}
        fixedOption={fixedOption}
        setFixedOption={setFixedOption}
        initialCustomAddress={previousCustomAddress}
        isEmail={isEmail}
      />
    </Dialog.Outer>
  )
}

type DialogInnerRef = {getFormState: () => string | null}

function DialogInner({
  formRef,
  fixedOption,
  setFixedOption,
  initialCustomAddress,
  isEmail,
}: {
  formRef: React.Ref<DialogInnerRef>
  fixedOption: SegmentedControlOptions
  setFixedOption: (opt: SegmentedControlOptions) => void
  initialCustomAddress: string
  isEmail: boolean
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()
  const [customAddress, setCustomAddress] = useState(initialCustomAddress)
  const [pdsAddressHistory, setPdsAddressHistory] = useState<string[]>(
    persisted.get('pdsAddressHistory') || [],
  )

  useImperativeHandle(
    formRef,
    () => ({
      getFormState: () => {
        if (fixedOption !== 'manual') {
          return null
        }
        let url = customAddress.trim().toLowerCase()
        if (!url) {
          return null
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          if (url === 'localhost' || url.startsWith('localhost:')) {
            url = `http://${url}`
          } else {
            url = `https://${url}`
          }
        }

        if (!pdsAddressHistory.includes(url)) {
          const newHistory = [url, ...pdsAddressHistory.slice(0, 4)]
          setPdsAddressHistory(newHistory)
          void persisted.write('pdsAddressHistory', newHistory)
        }

        return url
      },
    }),
    [customAddress, fixedOption, pdsAddressHistory],
  )

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title"
      style={web([{maxWidth: 400, borderRadius: 36}])}>
      <View style={[a.relative, a.gap_md, a.w_full]}>
        <Text
          nativeID="dialog-title"
          style={[a.text_2xl, a.font_bold, a.pr_5xl]}>
          <Trans>Choose your account provider</Trans>
        </Text>
        <SegmentedControl.Root
          type="tabs"
          label={l`Account provider`}
          value={fixedOption}
          onChange={setFixedOption}>
          <SegmentedControl.Item
            testID="automaticSelectBtn"
            value="automatic"
            label={l`Automatic`}>
            <SegmentedControl.ItemText>
              {l`Automatic`}
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item
            testID="manualSelectBtn"
            value="manual"
            label={l`Manual`}>
            <SegmentedControl.ItemText>{l`Manual`}</SegmentedControl.ItemText>
          </SegmentedControl.Item>
        </SegmentedControl.Root>

        {fixedOption === 'automatic' && (
          <View role="tabpanel">
            <Admonition type="tip">
              {isEmail ? (
                <Trans>
                  Your hosting provider can’t be detected from an email address,
                  so the default Bluesky service will be used. Enter your
                  username instead, or set your provider manually.
                </Trans>
              ) : (
                <Trans>
                  Your hosting provider is detected automatically from the
                  username you enter.
                </Trans>
              )}
            </Admonition>
          </View>
        )}

        {fixedOption === 'manual' && (
          <View role="tabpanel">
            <TextField.LabelText nativeID="address-input-label">
              <Trans>Server address</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <TextField.Icon icon={Globe} />
              <Dialog.Input
                testID="customServerTextInput"
                value={customAddress}
                onChangeText={setCustomAddress}
                label="my-server.com"
                accessibilityLabelledBy="address-input-label"
                autoCapitalize="none"
                keyboardType="url"
              />
            </TextField.Root>
            {pdsAddressHistory.length > 0 && (
              <View style={[a.flex_row, a.flex_wrap, a.mt_xs]}>
                {pdsAddressHistory.map(uri => (
                  <Button
                    key={uri}
                    variant="ghost"
                    color="primary"
                    label={uri}
                    style={[a.px_sm, a.py_xs, a.rounded_sm, a.gap_sm]}
                    onPress={() => setCustomAddress(uri)}>
                    <ButtonText>{uri}</ButtonText>
                  </Button>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={[a.py_xs]}>
          <Text
            nativeID="dialog-description"
            style={[t.atoms.text_contrast_medium, a.text_sm, a.leading_snug]}>
            <Trans>
              Bluesky is an open network where you can choose your hosting
              provider. If you're a developer, you can host your own server.
            </Trans>{' '}
            <InlineLinkText
              label={l`Learn more about self hosting your PDS.`}
              to="https://atproto.com/guides/self-hosting">
              <Trans>Learn more.</Trans>
            </InlineLinkText>
          </Text>
        </View>

        <Button
          testID="doneBtn"
          color="primary"
          size="large"
          onPress={() => control.close()}
          label={l`Done`}>
          <ButtonText>
            <Trans>Done</Trans>
          </ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

import {useCallback, useImperativeHandle, useRef, useState} from 'react'
import {View} from 'react-native'
import {useWindowDimensions} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {BSKY_SERVICE} from '#/lib/constants'
import * as persisted from '#/state/persisted'
import {useSession} from '#/state/session'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {InlineLinkText} from '#/components/Link'
import {P, Text} from '#/components/Typography'

export function ServerInputDialog({
  control,
  onSelect,
}: {
  control: Dialog.DialogOuterProps['control']
  onSelect: (url: string) => void
}) {
  const {height} = useWindowDimensions()
  const formRef = useRef<DialogInnerRef>(null)

  // persist these options between dialog open/close
  const [fixedOption, setFixedOption] = useState(BSKY_SERVICE)
  const [previousCustomAddress, setPreviousCustomAddress] = useState('')

  const onClose = useCallback(() => {
    const result = formRef.current?.getFormState()
    if (result) {
      onSelect(result)
      if (result !== BSKY_SERVICE) {
        setPreviousCustomAddress(result)
      }
    }
  }, [onSelect])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{minHeight: height / 2}}>
      <Dialog.Handle />
      <DialogInner
        formRef={formRef}
        fixedOption={fixedOption}
        setFixedOption={setFixedOption}
        initialCustomAddress={previousCustomAddress}
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
}: {
  formRef: React.Ref<DialogInnerRef>
  fixedOption: string
  setFixedOption: (opt: string) => void
  initialCustomAddress: string
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const {accounts} = useSession()
  const {gtMobile} = useBreakpoints()
  const [customAddress, setCustomAddress] = useState(initialCustomAddress)
  const [pdsAddressHistory, setPdsAddressHistory] = useState<string[]>(
    persisted.get('pdsAddressHistory') || [],
  )

  useImperativeHandle(
    formRef,
    () => ({
      getFormState: () => {
        let url
        if (fixedOption === 'custom') {
          url = customAddress.trim().toLowerCase()
          if (!url) {
            return null
          }
        } else {
          url = fixedOption
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          if (url === 'localhost' || url.startsWith('localhost:')) {
            url = `http://${url}`
          } else {
            url = `https://${url}`
          }
        }

        if (fixedOption === 'custom') {
          if (!pdsAddressHistory.includes(url)) {
            const newHistory = [url, ...pdsAddressHistory.slice(0, 4)]
            setPdsAddressHistory(newHistory)
            persisted.write('pdsAddressHistory', newHistory)
          }
        }

        return url
      },
    }),
    [customAddress, fixedOption, pdsAddressHistory],
  )

  const isFirstTimeUser = accounts.length === 0

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title">
      <View style={[a.relative, a.gap_md, a.w_full]}>
        <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
          <Trans>Choose your account provider</Trans>
        </Text>
        <ToggleButton.Group
          label="Preferences"
          values={[fixedOption]}
          onChange={values => setFixedOption(values[0])}>
          <ToggleButton.Button name={BSKY_SERVICE} label={_(msg`Bluesky`)}>
            <ToggleButton.ButtonText>{_(msg`Bluesky`)}</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button
            testID="customSelectBtn"
            name="custom"
            label={_(msg`Custom`)}>
            <ToggleButton.ButtonText>{_(msg`Custom`)}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>

        {fixedOption === BSKY_SERVICE && isFirstTimeUser && (
          <Admonition type="tip">
            <Trans>
              Bluesky is an open network where you can choose your own provider.
              If you're new here, we recommend sticking with the default Bluesky
              Social option.
            </Trans>
          </Admonition>
        )}

        {fixedOption === 'custom' && (
          <View
            style={[
              a.border,
              t.atoms.border_contrast_low,
              a.rounded_sm,
              a.px_md,
              a.py_md,
            ]}>
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
          <P
            style={[
              t.atoms.text_contrast_medium,
              a.text_sm,
              a.leading_snug,
              a.flex_1,
            ]}>
            {isFirstTimeUser ? (
              <Trans>
                If you're a developer, you can host your own server.
              </Trans>
            ) : (
              <Trans>
                Bluesky is an open network where you can choose your hosting
                provider. If you're a developer, you can host your own server.
              </Trans>
            )}{' '}
            <InlineLinkText
              label={_(msg`Learn more about self hosting your PDS.`)}
              to="https://atproto.com/guides/self-hosting">
              <Trans>Learn more.</Trans>
            </InlineLinkText>
          </P>
        </View>

        <View style={gtMobile && [a.flex_row, a.justify_end]}>
          <Button
            testID="doneBtn"
            variant="outline"
            color="primary"
            size="small"
            onPress={() => control.close()}
            label={_(msg`Done`)}>
            <ButtonText>{_(msg`Done`)}</ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}

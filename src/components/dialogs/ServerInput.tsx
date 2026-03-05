import {useCallback, useImperativeHandle, useRef, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {BSKY_SERVICE} from '#/lib/constants'
import * as persisted from '#/state/persisted'
import {useSession} from '#/state/session'
import {atoms as a, platform, useBreakpoints, useTheme, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

type SegmentedControlOptions = typeof BSKY_SERVICE | 'custom'

export function ServerInputDialog({
  control,
  onSelect,
}: {
  control: Dialog.DialogOuterProps['control']
  onSelect: (url: string) => void
}) {
  const ax = useAnalytics()
  const {height} = useWindowDimensions()
  const formRef = useRef<DialogInnerRef>(null)

  // persist these options between dialog open/close
  const [fixedOption, setFixedOption] =
    useState<SegmentedControlOptions>(BSKY_SERVICE)
  const [previousCustomAddress, setPreviousCustomAddress] = useState('')

  const onClose = useCallback(() => {
    const result = formRef.current?.getFormState()
    if (result) {
      onSelect(result)
      if (result !== BSKY_SERVICE) {
        setPreviousCustomAddress(result)
      }
    }
    ax.metric('signin:hostingProviderPressed', {
      hostingProviderDidChange: fixedOption !== BSKY_SERVICE,
    })
  }, [ax, onSelect, fixedOption])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={platform({
        android: {minHeight: height / 2},
        ios: {preventExpansion: true},
      })}>
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
  fixedOption: SegmentedControlOptions
  setFixedOption: (opt: SegmentedControlOptions) => void
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
      accessibilityLabelledBy="dialog-title"
      style={web({maxWidth: 500})}>
      <View style={[a.relative, a.gap_md, a.w_full]}>
        <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
          <Trans>Choose your account provider</Trans>
        </Text>
        <SegmentedControl.Root
          type="tabs"
          label={_(msg`Account provider`)}
          value={fixedOption}
          onChange={setFixedOption}>
          <SegmentedControl.Item
            testID="bskyServiceSelectBtn"
            value={BSKY_SERVICE}
            label={_(msg`Bluesky`)}>
            <SegmentedControl.ItemText>
              {_(msg`Bluesky`)}
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
          <SegmentedControl.Item
            testID="customSelectBtn"
            value="custom"
            label={_(msg`Custom`)}>
            <SegmentedControl.ItemText>
              {_(msg`Custom`)}
            </SegmentedControl.ItemText>
          </SegmentedControl.Item>
        </SegmentedControl.Root>

        {fixedOption === BSKY_SERVICE && isFirstTimeUser && (
          <View role="tabpanel">
            <Admonition type="tip">
              <Trans>
                Bluesky is an open network where you can choose your own
                provider. If you're new here, we recommend sticking with the
                default Bluesky Social option.
              </Trans>
            </Admonition>
          </View>
        )}

        {fixedOption === 'custom' && (
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
            style={[t.atoms.text_contrast_medium, a.text_sm, a.leading_snug]}>
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
          </Text>
        </View>

        <View style={gtMobile && [a.flex_row, a.justify_end]}>
          <Button
            testID="doneBtn"
            variant="solid"
            color="primary"
            size={platform({
              native: 'large',
              web: 'small',
            })}
            onPress={() => control.close()}
            label={_(msg`Done`)}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}

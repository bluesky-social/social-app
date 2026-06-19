import {useCallback, useImperativeHandle, useRef, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {BSKY_SERVICE} from '#/lib/constants'
import {enforceLen} from '#/lib/strings/helpers'
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

// Max recent-server shortcuts to keep/show, and the max label length before a
// chip is middle-truncated so it can't overflow the dialog.
const MAX_PDS_HISTORY = 5
const MAX_PDS_LABEL_LEN = 28

/**
 * Adds a scheme if the user omitted one. `localhost` defaults to http, anything
 * else to https.
 */
function normalizeServerUrl(raw: string): string {
  const url = raw.trim().toLowerCase()
  if (!url || url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url === 'localhost' || url.startsWith('localhost:')) {
    return `http://${url}`
  }
  return `https://${url}`
}

/**
 * A custom server address is valid if it parses as a URL with a hostname that
 * is either `localhost` or a dotted domain. This rejects garbage like
 * `localhost:2583asd` (invalid port) or a bare word with no TLD.
 */
function isValidServerUrl(raw: string): boolean {
  try {
    const {hostname} = new URL(normalizeServerUrl(raw))
    return hostname === 'localhost' || hostname.includes('.')
  } catch {
    return false
  }
}

export function ServerInputDialog({
  control,
  onSelect,
  customOnly,
}: {
  control: Dialog.DialogOuterProps['control']
  onSelect: (url: string) => void
  /**
   * When true, the dialog only exposes the custom-server input - no
   * Bluesky/Custom tab bar. Used by the login flow, where this dialog is an
   * override affordance for an already-resolved or default PDS.
   */
  customOnly?: boolean
}) {
  const ax = useAnalytics()
  const formRef = useRef<DialogInnerRef>(null)

  // persist these options between dialog open/close
  const [fixedOption, setFixedOption] = useState<SegmentedControlOptions>(
    customOnly ? 'custom' : BSKY_SERVICE,
  )
  const [previousCustomAddress, setPreviousCustomAddress] = useState('')

  const onClose = useCallback(() => {
    const result = formRef.current?.getFormState()
    if (result) {
      onSelect(result)
      if (result !== BSKY_SERVICE) {
        setPreviousCustomAddress(result)
      }
    } else if (customOnly) {
      // In custom-only mode, an empty form on close means the user wants to
      // clear their server override. Signal this to the caller with an empty
      // string; default mode preserves the legacy "no call on empty" behavior.
      onSelect('')
      setPreviousCustomAddress('')
    }
    ax.metric('signin:hostingProviderPressed', {
      hostingProviderDidChange: fixedOption !== BSKY_SERVICE,
    })
  }, [ax, onSelect, fixedOption, customOnly])

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
        customOnly={!!customOnly}
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
  customOnly,
}: {
  formRef: React.Ref<DialogInnerRef>
  fixedOption: SegmentedControlOptions
  setFixedOption: (opt: SegmentedControlOptions) => void
  initialCustomAddress: string
  customOnly: boolean
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const {accounts} = useSession()
  const {gtMobile} = useBreakpoints()
  const [customAddress, setCustomAddress] = useState(initialCustomAddress)
  const [validationError, setValidationError] = useState('')
  const [pdsAddressHistory, setPdsAddressHistory] = useState<string[]>(
    persisted.get('pdsAddressHistory') || [],
  )

  useImperativeHandle(
    formRef,
    () => ({
      getFormState: () => {
        if (fixedOption !== 'custom') {
          return fixedOption
        }
        // Guard against the dialog being dismissed (backdrop, escape, drag)
        // with an empty or invalid address - don't propagate garbage.
        if (!customAddress.trim() || !isValidServerUrl(customAddress)) {
          return null
        }
        const url = normalizeServerUrl(customAddress)
        if (!pdsAddressHistory.includes(url)) {
          const newHistory = [
            url,
            // Prune any legacy invalid entries while we're writing.
            ...pdsAddressHistory.filter(isValidServerUrl),
          ].slice(0, MAX_PDS_HISTORY)
          setPdsAddressHistory(newHistory)
          persisted.write('pdsAddressHistory', newHistory)
        }
        return url
      },
    }),
    [customAddress, fixedOption, pdsAddressHistory],
  )

  const isFirstTimeUser = accounts.length === 0

  // Drop legacy/invalid entries (history predates input validation) and cap the
  // count so the shortcuts can't overflow the dialog.
  const recentServers = pdsAddressHistory
    .filter(isValidServerUrl)
    .slice(0, MAX_PDS_HISTORY)

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title"
      style={web({maxWidth: 500})}>
      <View style={[a.relative, a.gap_md, a.w_full]}>
        <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
          {customOnly ? (
            <Trans>Use a custom server</Trans>
          ) : (
            <Trans>Choose your account provider</Trans>
          )}
        </Text>
        {!customOnly && (
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
        )}

        {!customOnly && fixedOption === BSKY_SERVICE && isFirstTimeUser && (
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
            <TextField.Root isInvalid={!!validationError}>
              <TextField.Icon icon={Globe} />
              <Dialog.Input
                testID="customServerTextInput"
                value={customAddress}
                onChangeText={v => {
                  setCustomAddress(v)
                  if (validationError) setValidationError('')
                }}
                label="my-server.com"
                accessibilityLabelledBy="address-input-label"
                autoCapitalize="none"
                keyboardType="url"
              />
            </TextField.Root>
            {validationError ? (
              <View style={[a.mt_xs]}>
                <Admonition type="error">{validationError}</Admonition>
              </View>
            ) : null}
            {recentServers.length > 0 && (
              <View style={[a.flex_row, a.flex_wrap, a.mt_xs]}>
                {recentServers.map(uri => (
                  <Button
                    key={uri}
                    variant="ghost"
                    color="primary"
                    label={uri}
                    style={[a.px_sm, a.py_xs, a.rounded_sm, a.gap_sm]}
                    onPress={() => setCustomAddress(uri)}>
                    <ButtonText numberOfLines={1}>
                      {enforceLen(uri, MAX_PDS_LABEL_LEN, true, 'middle')}
                    </ButtonText>
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
                Bluesky is part of the Atmosphere, an open network where you can
                choose your hosting provider. If you're a developer, you can
                host your own server.
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
            onPress={() => {
              // Block closing with an invalid custom address. An empty address
              // is allowed - it clears the override / keeps the default.
              if (
                fixedOption === 'custom' &&
                customAddress.trim() &&
                !isValidServerUrl(customAddress)
              ) {
                setValidationError(
                  _(msg`Enter a valid server address, e.g. example.com`),
                )
                return
              }
              control.close()
            }}
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

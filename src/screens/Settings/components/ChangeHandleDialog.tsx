import React, {useCallback, useMemo, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {createFullHandle, validateHandle} from '#/lib/strings/handles'
import {useUpdateHandleMutation} from '#/state/queries/handle'
import {useServiceQuery} from '#/state/queries/service'
import {useAgent, useSession} from '#/state/session'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {atoms as a, native, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ChangeHandleDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {height} = useWindowDimensions()

  return (
    <Dialog.Outer control={control} nativeOptions={{minHeight: height}}>
      <ChangeHandleDialogInner />
    </Dialog.Outer>
  )
}

function ChangeHandleDialogInner() {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const agent = useAgent()
  const {data: serviceInfo, error: serviceInfoError} = useServiceQuery(
    agent.serviceUrl.toString(),
  )
  const [handle, setHandle] = useState('')
  const {
    mutate: changeHandle,
    isPending,
    error,
    reset,
  } = useUpdateHandleMutation({
    onSuccess: () => {
      agent.resumeSession(agent.session!).then(() => control.close())
    },
  })

  const [page, setPage] = useState<'service-handle' | 'own-handle'>(
    'service-handle',
  )

  const cancelButton = useCallback(
    () => (
      <Button
        label={_(msg`Cancel`)}
        onPress={() => control.close()}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}>
        <ButtonText style={[a.text_md]}>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    ),
    [control, _],
  )

  const saveButton = useCallback(
    () => (
      <Button
        label={_(msg`Save`)}
        onPress={() => {
          if (handle) {
            changeHandle({handle})
          }
        }}
        size="small"
        color="primary"
        variant="ghost"
        style={[a.rounded_full]}
        disabled={isPending || handle === ''}>
        <ButtonText style={[a.text_md]}>
          <Trans>Save</Trans>
        </ButtonText>
      </Button>
    ),
    [isPending, changeHandle, handle, _],
  )

  return (
    <Dialog.ScrollableInner
      label={_(msg`Change Handle`)}
      header={
        <Dialog.Header renderLeft={cancelButton} renderRight={saveButton}>
          <Dialog.HeaderText>
            <Trans>Change Handle</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }
      contentContainerStyle={[a.pt_0, a.px_0]}>
      <View style={[a.flex_1, a.pt_lg, a.px_xl]}>
        {serviceInfoError ? (
          <ErrorScreen
            title={_(msg`Oops!`)}
            message={_(msg`There was an issue with fetching your service info`)}
            details={cleanError(serviceInfoError)}
          />
        ) : serviceInfo ? (
          <LayoutAnimationConfig skipEntering skipExiting>
            {page === 'service-handle' ? (
              <Animated.View
                key={page}
                entering={native(SlideInLeft)}
                exiting={native(SlideOutLeft)}>
                <ServiceHandlePage
                  serviceInfo={serviceInfo}
                  setHandle={setHandle}
                  goToOwnHandle={() => {
                    setHandle('')
                    setPage('own-handle')
                    reset()
                  }}
                  isPending={isPending}
                  error={error}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key={page}
                entering={native(SlideInRight)}
                exiting={native(SlideOutRight)}>
                <OwnHandlePage
                  setHandle={setHandle}
                  goToServiceHandle={() => {
                    setHandle('')
                    setPage('service-handle')
                    reset()
                  }}
                  isPending={isPending}
                  error={error}
                />
              </Animated.View>
            )}
          </LayoutAnimationConfig>
        ) : (
          <View style={[a.flex_1, a.justify_center, a.align_center, a.py_4xl]}>
            <Loader size="xl" />
          </View>
        )}
      </View>
    </Dialog.ScrollableInner>
  )
}

function ServiceHandlePage({
  serviceInfo,
  setHandle,
  goToOwnHandle,
  isPending,
  error,
}: {
  serviceInfo: ComAtprotoServerDescribeServer.OutputSchema
  setHandle: (handle: string) => void
  goToOwnHandle: () => void
  isPending: boolean
  error: Error | null
}) {
  const {_} = useLingui()
  const t = useTheme()
  const [subdomain, setSubdomain] = useState('')

  const host = serviceInfo.availableUserDomains[0]

  const validation = useMemo(
    () => validateHandle(subdomain, host),
    [subdomain, host],
  )

  const isInvalid =
    !validation.handleChars ||
    !validation.hyphenStartOrEnd ||
    !validation.totalLength

  return (
    <View style={[a.flex_1, a.gap_md]}>
      {error && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Admonition type="error">
            <Trans>Failed to change handle. Please try again.</Trans>
          </Admonition>
        </Animated.View>
      )}
      <Animated.View layout={LinearTransition} style={[a.flex_1, a.gap_md]}>
        <View>
          <TextField.LabelText>
            <Trans>New handle</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={isInvalid}>
            <TextField.Icon icon={AtIcon} />
            <Dialog.Input
              editable={!isPending}
              defaultValue={subdomain}
              onChangeText={text => {
                setSubdomain(text)
                if (validateHandle(text, host).overall) {
                  setHandle(createFullHandle(text, host))
                } else {
                  setHandle('')
                }
              }}
              label={_(msg`New handle`)}
              placeholder={_(msg`e.g. alice`)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextField.SuffixText label={host}>{host}</TextField.SuffixText>
          </TextField.Root>
        </View>
        <Text>
          <Trans>
            Your full handle will be{' '}
            <Text style={[a.font_bold]}>
              @{subdomain}
              {host}
            </Text>
          </Trans>
        </Text>
        <Button
          label={_(msg`I have my own domain`)}
          onPress={goToOwnHandle}
          style={[a.p_0, a.justify_start]}>
          <ButtonText style={[{color: t.palette.primary_500}, a.text_left]}>
            <Trans>I have my own domain</Trans>
          </ButtonText>
        </Button>
      </Animated.View>
    </View>
  )
}

function OwnHandlePage({
  goToServiceHandle,

  isPending,
  error,
}: {
  goToServiceHandle: () => void
  setHandle: (handle: string) => void
  isPending: boolean
  error: Error | null
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const [dnsPanel, setDNSPanel] = useState(true)
  const [domain, setDomain] = useState('')

  return (
    <View style={[a.flex_1, a.gap_lg]}>
      {error && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Admonition type="error">
            <Trans>Failed to change handle. Please try again.</Trans>
          </Admonition>
        </Animated.View>
      )}
      <Animated.View
        layout={LinearTransition}
        style={[a.flex_1, a.gap_md, a.overflow_hidden]}>
        <View>
          <TextField.LabelText>
            <Trans>Enter the domain you want to use</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Icon icon={AtIcon} />
            <Dialog.Input
              label={_(msg`New handle`)}
              placeholder={_(msg`e.g. alice.com`)}
              editable={!isPending}
              defaultValue={domain}
              onChangeText={setDomain}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </TextField.Root>
        </View>
        <ToggleButton.Group
          label={_(msg`Choose domain verification method`)}
          values={[dnsPanel ? 'dns' : 'file']}
          onChange={values => setDNSPanel(values[0] === 'dns')}>
          <ToggleButton.Button name="dns" label={_(msg`DNS Panel`)}>
            <ToggleButton.ButtonText>
              <Trans>DNS Panel</Trans>
            </ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="file" label={_(msg`No DNS Panel`)}>
            <ToggleButton.ButtonText>
              <Trans>No DNS Panel</Trans>
            </ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>
        {dnsPanel ? (
          <>
            <Text>
              <Trans>Add the following DNS record to your domain:</Trans>
            </Text>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.rounded_sm,
                a.p_md,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>Host:</Trans>
              </Text>
              <View style={[a.py_xs]}>
                <Text style={[a.text_md]}>_atproto</Text>
              </View>
              <Text style={[a.mt_xs, t.atoms.text_contrast_medium]}>
                <Trans>Type:</Trans>
              </Text>
              <View style={[a.py_xs]}>
                <Text style={[a.text_md]}>TXT</Text>
              </View>
              <Text style={[a.mt_xs, t.atoms.text_contrast_medium]}>
                <Trans>Value:</Trans>
              </Text>
              <View style={[a.py_xs]}>
                <Text style={[a.text_md]}>did={currentAccount?.did}</Text>
              </View>
            </View>
            <Text>
              <Trans>This should create a domain record at:</Trans>
            </Text>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.rounded_sm,
                a.p_md,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.text_md]}>_atproto.{domain}</Text>
            </View>
          </>
        ) : (
          <>
            <Text>
              <Trans>Upload a text file to:</Trans>
            </Text>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.rounded_sm,
                a.p_md,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.text_md]}>
                https://{domain}/.well-known/atproto-did
              </Text>
            </View>
            <Text>
              <Trans>That contains the following:</Trans>
            </Text>
            <View
              style={[
                t.atoms.bg_contrast_25,
                a.rounded_sm,
                a.p_md,
                a.border,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.text_md]}>{currentAccount?.did}</Text>
            </View>
          </>
        )}
      </Animated.View>
      <Animated.View layout={LinearTransition} style={[a.flex_1, a.gap_md]}>
        <Button
          label={_(msg`Use default provider`)}
          accessibilityHint={_(msg`Go back to previous page`)}
          onPress={goToServiceHandle}
          style={[a.p_0, a.justify_start]}>
          <ButtonText style={[{color: t.palette.primary_500}, a.text_left]}>
            <Trans>Nevermind, create a handle for me</Trans>
          </ButtonText>
        </Button>
      </Animated.View>
    </View>
  )
}

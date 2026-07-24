import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {FEEDBACK_FORM_URL} from '#/lib/constants'
import {AccordionAnimation} from '#/lib/custom-animations/AccordionAnimation'
import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {isInvalidHandle} from '#/lib/strings/handles'
import {RQKEY as RQKEY_PROFILE} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import {useOnboardingState} from '#/state/shell'
import {ChangeHandleDialog} from '#/screens/Settings/components/ChangeHandleDialog'
import {CopyButton} from '#/screens/Settings/components/CopyButton'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RefreshIcon} from '#/components/icons/ArrowRotate'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '#/components/icons/Chevron'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as ExternalIcon} from '#/components/icons/SquareArrowTopRight'
import {SquareBehindSquare4_Stroke2_Corner0_Rounded as CopyIcon} from '#/components/icons/SquareBehindSquare4'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {isSnoozed, snooze} from '#/features/invalidHandle/snoozing'
import {type IdentityDiagnosis} from '#/features/invalidHandle/types'
import {useIdentityDiagnosticsQuery} from '#/features/invalidHandle/useDiagnosticsQuery'
import {useDevMode} from '#/storage/hooks/dev-mode'

/**
 * Recovery dialog for accounts whose handle failed to verify and came back as
 * `handle.invalid`. Auto-opens (snoozed per account) when the condition is
 * detected on the current account, and can be reopened any time from the
 * profile header's invalid handle pill.
 */
export function InvalidHandleDialog() {
  const {invalidHandleDialogControl: control} = useGlobalDialogsControlContext()
  const changeHandleControl = Dialog.useDialogControl()
  const {hasSession, currentAccount} = useSession()
  const onboardingActive = useOnboardingState().isActive
  const did = currentAccount?.did

  useEffect(() => {
    if (!hasSession || !currentAccount) return
    if (onboardingActive) return
    if (!isInvalidHandle(currentAccount.handle)) return
    if (isSnoozed(currentAccount.did)) return
    control.open()
  }, [hasSession, currentAccount, onboardingActive, control])

  /*
   * If the user switches accounts while the dialog is open, close it so we
   * don't show diagnostics for the wrong account.
   */
  const prevDid = useRef(did)
  useEffect(() => {
    if (prevDid.current !== did) {
      prevDid.current = did
      control.close()
    }
  }, [did, control])

  return (
    <>
      <Dialog.Outer
        control={control}
        onClose={() => {
          if (did) snooze(did)
        }}>
        <Dialog.Handle />
        <InvalidHandleDialogInner
          openChangeHandle={() => changeHandleControl.open()}
        />
      </Dialog.Outer>
      <ChangeHandleDialog control={changeHandleControl} />
    </>
  )
}

function InvalidHandleDialogInner({
  openChangeHandle,
}: {
  openChangeHandle: () => void
}) {
  const control = Dialog.useDialogContext()
  const {t: l} = useLingui()
  const t = useTheme()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const openLink = useOpenLink()
  const [devMode] = useDevMode()

  const {
    data: report,
    isPending: isDiagnosing,
    refetch: rerunDiagnostics,
  } = useIdentityDiagnosticsQuery({enabled: true})

  const {
    mutate: refresh,
    isPending: isRefreshing,
    data: refreshFixedHandle,
  } = useMutation({
    mutationFn: async () => {
      try {
        /*
         * Ask the server to re-resolve our identity, busting its cache.
         * Typed errors (HandleNotFound etc.) are expected while the handle is
         * broken, and older PDS versions may not support the endpoint at all,
         * so failures here should not abort the refresh.
         */
        await agent.com.atproto.identity.refreshIdentity({
          identifier: currentAccount!.did,
        })
      } catch {}
      await agent.resumeSession(agent.session!)
      return !isInvalidHandle(agent.session?.handle ?? 'handle.invalid')
    },
    onSuccess: fixed => {
      if (currentAccount) {
        void queryClient.invalidateQueries({
          queryKey: RQKEY_PROFILE(currentAccount.did),
        })
      }
      if (fixed) {
        control.close(() => {
          Toast.show(l`Your handle has been verified!`, {type: 'success'})
        })
      } else {
        void rerunDiagnostics()
      }
    },
    onError: () => {
      Toast.show(l`Failed to refresh. Please try again.`, {type: 'error'})
    },
  })

  const intendedHandle = report?.intendedHandle
  const supportUrl = FEEDBACK_FORM_URL({
    email: currentAccount?.email,
    handle: intendedHandle ?? currentAccount?.handle,
  })

  return (
    <Dialog.ScrollableInner label={l`Handle verification failed`}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl]}>
            <Trans>We couldn’t verify your handle</Trans>
          </Text>
          {intendedHandle ? (
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              <Trans>
                Your account points to{' '}
                <Text style={[a.text_md, a.font_bold]}>@{intendedHandle}</Text>,
                but we couldn’t confirm that this handle belongs to you. Until
                it’s fixed, your handle will appear as invalid.
              </Trans>
            </Text>
          ) : (
            <Text
              style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
              <Trans>
                We couldn’t confirm that your handle belongs to you. Until it’s
                fixed, your handle will appear as invalid.
              </Trans>
            </Text>
          )}
        </View>

        {isDiagnosing ? (
          <View style={[a.align_center, a.py_lg]}>
            <Loader size="lg" />
          </View>
        ) : report ? (
          <DiagnosisMessage diagnosis={report.diagnosis} />
        ) : null}

        {refreshFixedHandle === false && !isRefreshing && (
          <Admonition type="warning">
            <Trans>
              Your handle is still not verified. If you just fixed your DNS
              record, it can take a little while for changes to take effect –
              try again in a few minutes.
            </Trans>
          </Admonition>
        )}

        {report && <ExpectedRecordInfo diagnosis={report.diagnosis} />}

        <Button
          label={l`Refresh my handle`}
          onPress={() => refresh()}
          disabled={isRefreshing}
          size="large"
          color="primary">
          {isRefreshing ? (
            <ButtonIcon icon={Loader} />
          ) : (
            <ButtonIcon icon={RefreshIcon} />
          )}
          <ButtonText>
            <Trans>Refresh</Trans>
          </ButtonText>
        </Button>

        <LikelyCauses />

        <View style={[a.gap_sm]}>
          <Button
            label={l`Change my handle`}
            onPress={() => control.close(() => openChangeHandle())}
            size="large"
            color="secondary">
            <ButtonIcon icon={AtIcon} />
            <ButtonText>
              <Trans>Change my handle</Trans>
            </ButtonText>
          </Button>
          <Button
            label={l`Contact support`}
            accessibilityHint={l`Opens helpdesk in browser`}
            onPress={() => openLink(supportUrl)}
            size="large"
            variant="ghost"
            color="secondary">
            <ButtonText>
              <Trans>Still stuck? Contact support</Trans>
            </ButtonText>
            <ButtonIcon icon={ExternalIcon} position="right" />
          </Button>
        </View>

        {devMode && report && (
          <View style={[a.gap_xs]}>
            <CopyButton
              value={JSON.stringify(report.raw, null, 2)}
              label="Copy debug info"
              size="small"
              color="secondary"
              shape="rectangular">
              <Text style={[a.font_bold, a.text_xs, a.flex_1]}>Debug</Text>
              <ButtonIcon icon={CopyIcon} />
            </CopyButton>
            <Text
              style={[
                a.text_xs,
                a.leading_tight,
                {fontFamily: 'monospace'},
                t.atoms.text_contrast_low,
              ]}>
              {JSON.stringify(report.raw, null, 2)}
            </Text>
          </View>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function DiagnosisMessage({diagnosis}: {diagnosis: IdentityDiagnosis}) {
  switch (diagnosis.type) {
    case 'resolves-correctly':
      return (
        <Admonition type="info">
          <Trans>
            Good news – your handle now appears to be set up correctly. Press
            Refresh below to re-verify it.
          </Trans>
        </Admonition>
      )
    case 'wrong-did':
      return (
        <Admonition type="error">
          <Trans>
            <Text style={[a.font_bold]}>@{diagnosis.handle}</Text> currently
            points to a different account ({diagnosis.found}). Update your DNS
            TXT record or well-known file to contain this account’s DID, shown
            below.
          </Trans>
        </Admonition>
      )
    case 'not-resolving':
      return (
        <Admonition type="warning">
          <Trans>
            <Text style={[a.font_bold]}>@{diagnosis.handle}</Text> isn’t
            resolving to your account. This usually means a problem with the
            domain’s DNS record – see the likely causes below.
          </Trans>
        </Admonition>
      )
    case 'service-handle-issue':
      return (
        <Admonition type="warning">
          <Trans>
            Your handle is provided by your hosting service, so this is likely a
            temporary issue on the server. Try pressing Refresh, and contact
            support if it doesn’t resolve.
          </Trans>
        </Admonition>
      )
    case 'no-aka-handle':
      return (
        <Admonition type="error">
          <Trans>
            Your account doesn’t declare a handle. Set a new one using the
            “Change my handle” button below.
          </Trans>
        </Admonition>
      )
    case 'network-unavailable':
      return (
        <Admonition type="warning">
          <Trans>
            We couldn’t run checks on your handle – you appear to be offline.
          </Trans>
        </Admonition>
      )
    case 'inconclusive':
      return (
        <Admonition type="info">
          <Trans>
            We couldn’t determine the exact cause from this device. See the
            likely causes below.
          </Trans>
        </Admonition>
      )
  }
}

/**
 * For diagnoses that point at a broken or missing record, show the exact
 * value the user needs to publish, with a copy button.
 */
function ExpectedRecordInfo({diagnosis}: {diagnosis: IdentityDiagnosis}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()

  if (
    diagnosis.type !== 'wrong-did' &&
    diagnosis.type !== 'not-resolving' &&
    diagnosis.type !== 'inconclusive'
  ) {
    return null
  }
  if (!currentAccount) return null

  return (
    <View style={[a.gap_sm]}>
      <Text style={[t.atoms.text_contrast_medium]}>
        <Trans>Your DNS TXT record value should be:</Trans>
      </Text>
      <View
        style={[
          a.rounded_sm,
          a.p_md,
          a.border,
          t.atoms.bg_contrast_25,
          t.atoms.border_contrast_low,
        ]}>
        <CopyButton
          color="secondary"
          value={'did=' + currentAccount.did}
          label={l`Copy TXT record value`}
          style={[a.bg_transparent]}
          hoverStyle={[a.bg_transparent]}>
          <Text style={[a.text_md, a.flex_1]}>did={currentAccount.did}</Text>
          <ButtonIcon icon={CopyIcon} />
        </CopyButton>
      </View>
    </View>
  )
}

function LikelyCauses() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const did = currentAccount?.did ?? ''

  return (
    <View style={[a.gap_sm]}>
      <Text style={[a.font_bold, a.text_lg]}>
        <Trans>Likely causes</Trans>
      </Text>
      <FaqItem title={l`The DNS record is missing`}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            For a custom domain handle, your domain must have a TXT record with
            host <Text style={[a.font_bold]}>_atproto</Text> and value{' '}
            <Text style={[a.font_bold]}>did={did}</Text>. Add it in your DNS
            provider’s control panel.
          </Trans>
        </Text>
      </FaqItem>
      <FaqItem title={l`There are multiple TXT records`}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            There must be exactly one <Text style={[a.font_bold]}>did=</Text>{' '}
            TXT record on the <Text style={[a.font_bold]}>_atproto</Text> host.
            If you have more than one – for example, one left over from a
            previous account – delete the extras.
          </Trans>
        </Text>
      </FaqItem>
      <FaqItem title={l`The record points to the wrong account`}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            The DID in your TXT record or well-known file must exactly match
            this account’s DID: <Text style={[a.font_bold]}>{did}</Text>. A
            record copied from another account won’t work.
          </Trans>
        </Text>
      </FaqItem>
      <FaqItem title={l`The domain expired or isn’t resolving`}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            If your domain registration lapsed or its nameservers are
            misconfigured, the handle can’t be verified. Check that your domain
            is active with your registrar.
          </Trans>
        </Text>
      </FaqItem>
      <FaqItem title={l`The change hasn’t propagated yet`}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            DNS changes can take up to 24 hours to take effect. If you recently
            fixed your record, wait a little while and press Refresh again.
          </Trans>
        </Text>
      </FaqItem>
      <FaqItem title={l`The well-known file is wrong or missing`}>
        <Text style={[a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            If you verify via a file instead of DNS, your site must serve{' '}
            <Text style={[a.font_bold]}>
              https://your-domain/.well-known/atproto-did
            </Text>{' '}
            containing exactly <Text style={[a.font_bold]}>{did}</Text>.
          </Trans>
        </Text>
      </FaqItem>
      <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans context="english-only-resource">
          For a full walkthrough, see the{' '}
          <InlineLinkText
            label={l`View domain handle tutorial`}
            to="https://bsky.social/about/blog/4-28-2023-domain-handle-tutorial"
            disableMismatchWarning>
            domain handle tutorial
          </InlineLinkText>
          .
        </Trans>
      </Text>
    </View>
  )
}

function FaqItem({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const t = useTheme()
  const [expanded, setExpanded] = useState(false)

  return (
    <View
      style={[
        a.border,
        a.rounded_sm,
        a.overflow_hidden,
        t.atoms.border_contrast_low,
      ]}>
      <Button
        label={title}
        onPress={() => setExpanded(prev => !prev)}
        style={[a.flex_row, a.align_center, a.gap_sm, a.p_md]}
        hoverStyle={[t.atoms.bg_contrast_25]}>
        <Text style={[a.flex_1, a.text_md, a.font_semi_bold]}>{title}</Text>
        <ButtonIcon icon={expanded ? ChevronTopIcon : ChevronBottomIcon} />
      </Button>
      <AccordionAnimation isExpanded={expanded}>
        <View style={[a.px_md, a.pb_md]}>{children}</View>
      </AccordionAnimation>
    </View>
  )
}

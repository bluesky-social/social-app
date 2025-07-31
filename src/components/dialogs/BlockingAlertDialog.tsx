import {type ReactNode, useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Logo} from '#/view/icons/Logo'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {InlineLinkText} from '#/components/Link'
import {Span, Text} from '#/components/Typography'

export function BlockingAlertDialog() {
  const {enabled} = usePolicyUpdate20250801()

  return (
    <>
      {enabled && (
        <BlockingAnnouncementDialogOuter>
          <PolicyUpdate20250801 />
        </BlockingAnnouncementDialogOuter>
      )}
    </>
  )
}

function useForceClose() {
  const {close} = Dialog.useDialogContext()
  return useCallback(
    (cb?: () => void) => {
      close(cb, true)
    },
    [close],
  )
}

export function BlockingAnnouncementDialogOuter({
  children,
}: {
  children: ReactNode
}) {
  const {signinDialogControl: control} = useGlobalDialogsControlContext()

  Dialog.useAutoOpen(control, 1e3)

  return (
    <Dialog.Outer preventDismiss control={control}>
      <Dialog.Handle />
      {children}
    </Dialog.Outer>
  )
}

export function AnnouncementBadge() {
  const t = useTheme()
  return (
    <View style={[a.align_start]}>
      <View
        style={[
          a.pl_md,
          a.pr_lg,
          a.py_sm,
          a.rounded_full,
          a.flex_row,
          a.align_center,
          a.gap_xs,
          {
            backgroundColor: t.palette.primary_25,
          },
        ]}>
        <Logo fill={t.palette.primary_600} width={14} />
        <Text
          style={[
            a.font_bold,
            {
              color: t.palette.primary_600,
            },
          ]}>
          <Trans>Announcement</Trans>
        </Text>
      </View>
    </View>
  )
}

function usePolicyUpdate20250801() {
  return {
    enabled: true,
  }
}

function PolicyUpdate20250801() {
  const t = useTheme()
  const {_} = useLingui()
  const forceClose = useForceClose()

  const linkStyle = [a.text_md]
  const links = {
    terms: {
      overridePresentation: true,
      to: `https://bsky.social/about/support`,
      label: _(msg`Terms of Service`),
      style: linkStyle,
    },
    privacy: {
      overridePresentation: true,
      to: `https://bsky.social/about/support`,
      label: _(msg`Privacy Policy`),
      style: linkStyle,
    },
    copyright: {
      overridePresentation: true,
      to: `https://bsky.social/about/support`,
      label: _(msg`Copyright Policy`),
      style: linkStyle,
    },
    guidelines: {
      overridePresentation: true,
      to: `https://bsky.social/about/support`,
      label: _(msg`Community Guidelines`),
      style: linkStyle,
    },
    blog: {
      overridePresentation: true,
      to: `https://bsky.social/about/support`,
      label: _(msg`Our blog post`),
      style: linkStyle,
    },
  }

  const handleClose = useCallback(() => {
    forceClose(() => {
      console.log('closed')
    })
  }, [forceClose])

  return (
    <Dialog.ScrollableInner
      label={_(msg`Sign in to Bluesky or create a new account`)}
      style={[web({maxWidth: 420})]}>
      <View style={[a.align_start, a.gap_xl]}>
        <AnnouncementBadge />

        <View style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold, a.leading_snug]}>
            <Trans>Hey there 👋</Trans>
          </Text>
          <Text emoji style={[a.leading_snug, a.text_md]}>
            <Trans>
              We’re updating our{' '}
              <InlineLinkText {...links.terms}>Terms of Service</InlineLinkText>
              ,{' '}
              <InlineLinkText {...links.privacy}>Privacy Policy</InlineLinkText>
              , and{' '}
              <InlineLinkText {...links.copyright}>
                Copyright Policy
              </InlineLinkText>
              , <Span style={[]}>effective September 1st, 2025.</Span>
            </Trans>
          </Text>
          <Text style={[a.leading_snug, a.text_md]}>
            <Trans>
              We're also updating our{' '}
              <InlineLinkText {...links.guidelines}>
                Community Guidelines
              </InlineLinkText>
              , <Span style={[]}>and we want your input!</Span> These new
              guidelines will take effect on{' '}
              <Span style={[]}>October 1st, 2025.</Span>
            </Trans>
          </Text>
          <Text emoji style={[a.leading_snug, a.text_md]}>
            <Trans>
              Learn more about these changes and how to share your thoughts with
              us by{' '}
              <InlineLinkText {...links.blog}>
                reading our blog post.
              </InlineLinkText>
            </Trans>
          </Text>
        </View>

        <View style={[a.w_full, a.gap_md]}>
          <Button
            label={_(msg`Continue`)}
            color="primary"
            size="large"
            onPress={handleClose}>
            <ButtonText>
              <Trans>Continue</Trans>
            </ButtonText>
          </Button>

          <Text
            style={[
              a.leading_snug,
              a.text_sm,
              a.italic,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>
              By clicking "Continue" you acknowledge that you understand and
              agree to these updates.
            </Trans>
          </Text>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}

import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Nux} from '#/state/queries/nuxs'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  AnnouncementBadge,
  useAnnouncementState,
  useForceClose,
} from '#/components/dialogs/BlockingAnnouncements/common'
import {InlineLinkText} from '#/components/Link'
import {Span, Text} from '#/components/Typography'

export function useLocalState() {
  return useAnnouncementState({
    id: Nux.BlockingAnnouncementPolicyUpdate20250801,
  })
}

export function Announcement() {
  const t = useTheme()
  const {_} = useLingui()
  const forceClose = useForceClose()
  const {complete} = useLocalState()

  const handleClose = useCallback(() => {
    forceClose(() => complete())
  }, [forceClose, complete])

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

  return (
    <Dialog.ScrollableInner
      label={_(msg`We’re updating our policies`)}
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

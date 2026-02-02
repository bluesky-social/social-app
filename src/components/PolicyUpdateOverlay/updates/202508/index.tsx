import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useA11y} from '#/state/a11y'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {InlineLinkText, Link} from '#/components/Link'
import {Badge} from '#/components/PolicyUpdateOverlay/Badge'
import {Overlay} from '#/components/PolicyUpdateOverlay/Overlay'
import {type PolicyUpdateState} from '#/components/PolicyUpdateOverlay/usePolicyUpdateState'
import {Text} from '#/components/Typography'
import {IS_ANDROID} from '#/env'

export function Content({state}: {state: PolicyUpdateState}) {
  const t = useTheme()
  const {_} = useLingui()
  const {screenReaderEnabled} = useA11y()

  const handleClose = useCallback(() => {
    state.complete()
  }, [state])

  const linkStyle = [a.text_md]
  const links = {
    terms: {
      overridePresentation: false,
      to: `https://bsky.social/about/support/tos`,
      label: _(msg`Terms of Service`),
    },
    privacy: {
      overridePresentation: false,
      to: `https://bsky.social/about/support/privacy-policy`,
      label: _(msg`Privacy Policy`),
    },
    copyright: {
      overridePresentation: false,
      to: `https://bsky.social/about/support/copyright`,
      label: _(msg`Copyright Policy`),
    },
    guidelines: {
      overridePresentation: false,
      to: `https://bsky.social/about/support/community-guidelines`,
      label: _(msg`Community Guidelines`),
    },
    blog: {
      overridePresentation: false,
      to: `https://bsky.social/about/blog/08-14-2025-updated-terms-and-policies`,
      label: _(msg`Our blog post`),
    },
  }
  const linkButtonStyles = {
    overridePresentation: false,
    color: 'secondary',
    size: 'small',
  } as const

  const label = IS_ANDROID
    ? _(
        msg`We’re updating our Terms of Service, Privacy Policy, and Copyright Policy, effective September 15th, 2025. We're also updating our Community Guidelines, and we want your input! These new guidelines will take effect on October 15th, 2025. Learn more about these changes and how to share your thoughts with us by reading our blog post.`,
      )
    : _(msg`We're updating our policies`)

  return (
    <Overlay label={label}>
      <View style={[a.align_start, a.gap_xl]}>
        <Badge />

        {screenReaderEnabled ? (
          <View style={[a.gap_sm]}>
            <Text emoji style={[a.text_2xl, a.font_semi_bold, a.leading_snug]}>
              <Trans>Hey there 👋</Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                We’re updating our Terms of Service, Privacy Policy, and
                Copyright Policy, effective September 15th, 2025.
              </Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                We're also updating our Community Guidelines, and we want your
                input! These new guidelines will take effect on October 15th,
                2025.
              </Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                Learn more about these changes and how to share your thoughts
                with us by reading our blog post.
              </Trans>
            </Text>

            <Link {...links.terms} {...linkButtonStyles}>
              <ButtonText>
                <Trans>Terms of Service</Trans>
              </ButtonText>
            </Link>
            <Link {...links.privacy} {...linkButtonStyles}>
              <ButtonText>
                <Trans>Privacy Policy</Trans>
              </ButtonText>
            </Link>
            <Link {...links.copyright} {...linkButtonStyles}>
              <ButtonText>
                <Trans>Copyright Policy</Trans>
              </ButtonText>
            </Link>
            <Link {...links.blog} {...linkButtonStyles}>
              <ButtonText>
                <Trans>Read our blog post</Trans>
              </ButtonText>
            </Link>
          </View>
        ) : (
          <View style={[a.gap_sm]}>
            <Text emoji style={[a.text_2xl, a.font_semi_bold, a.leading_snug]}>
              <Trans>Hey there 👋</Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                We’re updating our{' '}
                <InlineLinkText {...links.terms} style={linkStyle}>
                  Terms of Service
                </InlineLinkText>
                ,{' '}
                <InlineLinkText {...links.privacy} style={linkStyle}>
                  Privacy Policy
                </InlineLinkText>
                , and{' '}
                <InlineLinkText {...links.copyright} style={linkStyle}>
                  Copyright Policy
                </InlineLinkText>
                , effective September 15th, 2025.
              </Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                We're also updating our{' '}
                <InlineLinkText {...links.guidelines} style={linkStyle}>
                  Community Guidelines
                </InlineLinkText>
                , and we want your input! These new guidelines will take effect
                on October 15th, 2025.
              </Trans>
            </Text>
            <Text style={[a.leading_snug, a.text_md]}>
              <Trans>
                Learn more about these changes and how to share your thoughts
                with us by{' '}
                <InlineLinkText {...links.blog} style={linkStyle}>
                  reading our blog post.
                </InlineLinkText>
              </Trans>
            </Text>
          </View>
        )}

        <View style={[a.w_full, a.gap_md]}>
          <Button
            label={_(msg`Continue`)}
            accessibilityHint={_(
              msg`Tap to acknowledge that you understand and agree to these updates and continue using Bluesky`,
            )}
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
    </Overlay>
  )
}

import {type ReactElement} from 'react'
import {View} from 'react-native'
import {type ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {webLinks} from '#/lib/constants'
import {useGate} from '#/lib/statsig/statsig'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

function CommunityGuidelinesNotice({}: {}) {
  const {_} = useLingui()
  const gate = useGate()

  if (gate('disable_onboarding_policy_update_notice')) return null

  return (
    <View style={[a.pt_xs]}>
      <Admonition type="tip">
        <Trans>
          You also agree to{' '}
          <InlineLinkText
            label={_(msg`Bluesky's Community Guidelines`)}
            to={webLinks.communityDeprecated}>
            Bluesky’s Community Guidelines
          </InlineLinkText>
          . An{' '}
          <InlineLinkText
            label={_(msg`Bluesky's Updated Community Guidelines`)}
            to={webLinks.community}>
            updated version of our Community Guidelines
          </InlineLinkText>{' '}
          will take effect on October 15th.
        </Trans>
      </Admonition>
    </View>
  )
}

export const Policies = ({
  serviceDescription,
  needsGuardian,
  under13,
}: {
  serviceDescription: ComAtprotoServerDescribeServer.OutputSchema
  needsGuardian: boolean
  under13: boolean
}) => {
  const t = useTheme()
  const {_} = useLingui()

  if (!serviceDescription) {
    return <View />
  }

  const tos = validWebLink(serviceDescription.links?.termsOfService)
  const pp = validWebLink(serviceDescription.links?.privacyPolicy)

  if (!tos && !pp) {
    return (
      <View style={[a.gap_sm]}>
        <Admonition type="info">
          <Trans>
            This service has not provided terms of service or a privacy policy.
          </Trans>
        </Admonition>
        <CommunityGuidelinesNotice />
      </View>
    )
  }

  let els: ReactElement
  if (tos && pp) {
    els = (
      <Trans>
        By creating an account you agree to the{' '}
        <InlineLinkText
          label={_(msg`Read the Bluesky Terms of Service`)}
          key="tos"
          to={tos}>
          Terms of Service
        </InlineLinkText>{' '}
        and{' '}
        <InlineLinkText
          label={_(msg`Read the Bluesky Privacy Policy`)}
          key="pp"
          to={pp}>
          Privacy Policy
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (tos) {
    els = (
      <Trans>
        By creating an account you agree to the{' '}
        <InlineLinkText
          label={_(msg`Read the Bluesky Terms of Service`)}
          key="tos"
          to={tos}>
          Terms of Service
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (pp) {
    els = (
      <Trans>
        By creating an account you agree to the{' '}
        <InlineLinkText
          label={_(msg`Read the Bluesky Privacy Policy`)}
          key="pp"
          to={pp}>
          Privacy Policy
        </InlineLinkText>
        .
      </Trans>
    )
  } else {
    return null
  }

  return (
    <View style={[a.gap_sm]}>
      {els ? (
        <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
          {els}
        </Text>
      ) : null}

      {under13 ? (
        <Admonition type="error">
          <Trans>
            You must be 13 years of age or older to create an account.
          </Trans>
        </Admonition>
      ) : needsGuardian ? (
        <Admonition type="warning">
          <Trans>
            If you are not yet an adult according to the laws of your country,
            your parent or legal guardian must read these Terms on your behalf.
          </Trans>
        </Admonition>
      ) : undefined}

      <CommunityGuidelinesNotice />
    </View>
  )
}

function validWebLink(url?: string): string | undefined {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : undefined
}

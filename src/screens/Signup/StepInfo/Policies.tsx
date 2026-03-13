import {type ReactElement} from 'react'
import {View} from 'react-native'
import {type ComAtprotoServerDescribeServer} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export const Policies = ({
  serviceDescription,
}: {
  serviceDescription: ComAtprotoServerDescribeServer.OutputSchema
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
      </View>
    )
  }

  let els: ReactElement<any>
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

  return els ? (
    <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>{els}</Text>
  ) : null
}

function validWebLink(url?: string): string | undefined {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : undefined
}

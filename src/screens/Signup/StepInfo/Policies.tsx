import React, {ReactElement} from 'react'
import {View} from 'react-native'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

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

  if (!serviceDescription) {
    return <View />
  }

  const tos = validWebLink(serviceDescription.links?.termsOfService)
  const pp = validWebLink(serviceDescription.links?.privacyPolicy)

  if (!tos && !pp) {
    return (
      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
        <CircleInfo size="md" fill={t.atoms.text_contrast_low.color} />

        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>
            This service has not provided terms of service or a privacy policy.
          </Trans>
        </Text>
      </View>
    )
  }

  let els: ReactElement
  if (tos && pp) {
    els = (
      <Trans>
        By creating an account you agree to the{' '}
        <InlineLinkText key="tos" to={tos}>
          Terms of Service
        </InlineLinkText>{' '}
        and{' '}
        <InlineLinkText key="pp" to={pp}>
          Privacy Policy
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (tos) {
    els = (
      <Trans>
        By creating an account you agree to the{' '}
        <InlineLinkText key="tos" to={tos}>
          Terms of Service
        </InlineLinkText>
        .
      </Trans>
    )
  } else if (pp) {
    els = (
      <Trans>
        By creating an account you agree to the{' '}
        <InlineLinkText key="pp" to={pp}>
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
      <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>{els}</Text>

      {under13 ? (
        <Text style={[a.font_bold, a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>You must be 13 years of age or older to sign up.</Trans>
        </Text>
      ) : needsGuardian ? (
        <Text style={[a.font_bold, a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>
            If you are not yet an adult according to the laws of your country,
            your parent or legal guardian must read these Terms on your behalf.
          </Trans>
        </Text>
      ) : undefined}
    </View>
  )
}

function validWebLink(url?: string): string | undefined {
  return url && (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : undefined
}

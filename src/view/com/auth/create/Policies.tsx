import React from 'react'
import {Linking, StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {ComAtprotoServerDescribeServer} from '@atproto/api'
import {TextLink} from '../../util/Link'
import {Text} from '../../util/text/Text'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const Policies = ({
  serviceDescription,
  needsGuardian,
  under13,
}: {
  serviceDescription: ServiceDescription
  needsGuardian: boolean
  under13: boolean
}) => {
  const pal = usePalette('default')
  const {_} = useLingui()
  if (!serviceDescription) {
    return <View />
  }
  const tos = validWebLink(serviceDescription.links?.termsOfService)
  const pp = validWebLink(serviceDescription.links?.privacyPolicy)
  if (!tos && !pp) {
    return (
      <View style={[styles.policies, {flexDirection: 'row'}]}>
        <View
          style={[
            styles.errorIcon,
            {borderColor: pal.colors.text, marginTop: 1},
          ]}>
          <FontAwesomeIcon
            icon="exclamation"
            style={pal.textLight as FontAwesomeIconStyle}
            size={10}
          />
        </View>
        <Text style={[pal.textLight, s.pl5, s.flex1]}>
          <Trans>
            This service has not provided terms of service or a privacy policy.
          </Trans>
        </Text>
      </View>
    )
  }
  const els = []
  if (tos) {
    els.push(
      <TextLink
        key="tos"
        href={tos}
        text={_(msg`Terms of Service`)}
        style={[pal.link, s.underline]}
        onPress={() => Linking.openURL(tos)}
      />,
    )
  }
  if (pp) {
    els.push(
      <TextLink
        key="pp"
        href={pp}
        text={_(msg`Privacy Policy`)}
        style={[pal.link, s.underline]}
        onPress={() => Linking.openURL(pp)}
      />,
    )
  }
  if (els.length === 2) {
    els.splice(
      1,
      0,
      <Text key="and" style={pal.textLight}>
        {' '}
        and{' '}
      </Text>,
    )
  }
  return (
    <View style={styles.policies}>
      <Text style={pal.textLight}>
        <Trans>By creating an account you agree to the {els}.</Trans>
      </Text>
      {under13 ? (
        <Text style={[pal.textLight, s.bold]}>
          You must be 13 years of age or older to sign up.
        </Text>
      ) : needsGuardian ? (
        <Text style={[pal.textLight, s.bold]}>
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

const styles = StyleSheet.create({
  policies: {
    flexDirection: 'column',
    gap: 8,
  },
  errorIcon: {
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 30,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

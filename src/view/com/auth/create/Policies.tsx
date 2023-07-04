import React from 'react'
import {StyleSheet, View} from 'react-native'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {TextLink} from '../../util/Link'
import {Text} from '../../util/text/Text'
import {s, colors} from 'lib/styles'
import {ServiceDescription} from 'state/models/session'
import {usePalette} from 'lib/hooks/usePalette'

export const Policies = ({
  serviceDescription,
  needsGuardian,
}: {
  serviceDescription: ServiceDescription
  needsGuardian: boolean
}) => {
  const pal = usePalette('default')
  if (!serviceDescription) {
    return <View />
  }
  const tos = validWebLink(serviceDescription.links?.termsOfService)
  const pp = validWebLink(serviceDescription.links?.privacyPolicy)
  if (!tos && !pp) {
    return (
      <View style={styles.policies}>
        <View style={[styles.errorIcon, {borderColor: pal.colors.text}, s.mt2]}>
          <FontAwesomeIcon
            icon="exclamation"
            style={pal.textLight as FontAwesomeIconStyle}
            size={10}
          />
        </View>
        <Text style={[pal.textLight, s.pl5, s.flex1]}>
          This service has not provided terms of service or a privacy policy.
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
        text="Terms of Service"
        style={[pal.link, s.underline]}
      />,
    )
  }
  if (pp) {
    els.push(
      <TextLink
        key="pp"
        href={pp}
        text="Privacy Policy"
        style={[pal.link, s.underline]}
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
        By creating an account you agree to the {els}.
      </Text>
      {needsGuardian && (
        <Text style={[pal.textLight, s.bold]}>
          If you are not yet an adult according to the laws of your country,
          your parent or legal guardian must read these Terms on your behalf.
        </Text>
      )}
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
    marginRight: 5,
  },
})

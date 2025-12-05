import * as Contacts from 'expo-contacts'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {
  type AllNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {isNative} from '#/platform/detection'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {ButtonText} from '#/components/Button'
import {ContactsHeroImage} from '#/components/contacts/components/HeroImage'
import * as Layout from '#/components/Layout'
import {InlineLinkText, Link} from '#/components/Link'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<AllNavigatorParams, 'FindContactsSettings'>
export function FindContactsSettingsScreen({}: Props) {
  const {_} = useLingui()

  const hasInitiated = false

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Find contacts</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {isNative ? (
        !hasInitiated ? (
          <Intro />
        ) : (
          <Status />
        )
      ) : (
        <ErrorScreen
          title={_(msg`Not available on this platform.`)}
          message={_(msg`Please use the native app to sync your contacts.`)}
          showHeader
        />
      )}
    </Layout.Screen>
  )
}

function Intro() {
  const gutter = useGutters(['base'])
  const t = useTheme()
  const {_} = useLingui()

  const {data: isAvailable, isSuccess} = useQuery({
    queryKey: ['contacts-available'],
    queryFn: async () => await Contacts.isAvailableAsync(),
  })

  return (
    <Layout.Content contentContainerStyle={[gutter, a.gap_lg]}>
      <ContactsHeroImage />
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        <Trans>
          Find your friends on Bluesky by verifying your phone number and
          matching with your contacts. We protect your information and you
          control what happens next.{' '}
          <InlineLinkText
            to="#"
            label={_(msg`Learn more`)}
            style={[a.text_md, a.leading_snug]}>
            TODO: Learn more
          </InlineLinkText>
        </Trans>
      </Text>
      {isAvailable ? (
        <Link
          to={{screen: 'FindContactsFlow'}}
          label={_(msg`Upload contacts`)}
          size="large"
          color="primary"
          style={[a.flex_1, a.justify_center]}>
          <ButtonText>
            <Trans>Upload contacts</Trans>
          </ButtonText>
        </Link>
      ) : (
        isSuccess && (
          <Admonition type="error">
            <Trans>
              Contact sync is not available on this device, as the app is unable
              to access your contacts.
            </Trans>
          </Admonition>
        )
      )}
    </Layout.Content>
  )
}

function Status() {
  return null
}

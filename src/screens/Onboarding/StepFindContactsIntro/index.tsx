import {View} from 'react-native'
import * as Contacts from 'expo-contacts'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQuery} from '@tanstack/react-query'

import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {ContactsHeroImage} from '#/components/contacts/components/HeroImage'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {OnboardingControls} from '../Layout'
import {useOnboardingInternalState} from '../state'

export function StepFindContactsIntro() {
  const {_} = useLingui()
  const t = useTheme()
  const {dispatch} = useOnboardingInternalState()

  const {data: isAvailable, isSuccess} = useQuery({
    queryKey: ['contacts-available'],
    queryFn: async () => await Contacts.isAvailableAsync(),
  })

  return (
    <View style={[a.w_full, a.gap_lg]}>
      <ContactsHeroImage />
      <Text style={[a.text_3xl, a.leading_snug, a.font_bold]}>
        <Trans>Bluesky is more fun with friends</Trans>
      </Text>
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
      {!isAvailable && isSuccess && (
        <Admonition type="error">
          <Trans>
            Contact sync is not available on this device, as the app is unable
            to access your contacts.
          </Trans>
        </Admonition>
      )}

      <OnboardingControls.Portal>
        <View style={[a.gap_md]}>
          <Button
            onPress={() => dispatch({type: 'next'})}
            label={_(msg`Upload contacts`)}
            size="large"
            color="primary">
            <ButtonText>
              <Trans>Upload contacts</Trans>
            </ButtonText>
          </Button>
          <Button
            onPress={() => dispatch({type: 'skip-contacts'})}
            label={_(msg`Skip`)}
            size="large"
            color="secondary">
            <ButtonText>
              <Trans>Skip</Trans>
            </ButtonText>
          </Button>
        </View>
      </OnboardingControls.Portal>
    </View>
  )
}

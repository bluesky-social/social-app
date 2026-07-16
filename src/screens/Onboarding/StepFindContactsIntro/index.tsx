import {View} from 'react-native'
import * as Contacts from 'expo-contacts'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useQuery} from '@tanstack/react-query'

import {useCallOnce} from '#/lib/once'
import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {ContactsHeroImage} from '#/components/contacts/components/HeroImage'
import {useAnalytics} from '#/analytics'
import {
  OnboardingControls,
  OnboardingDescriptionText,
  OnboardingPosition,
  OnboardingTitleText,
} from '../Layout'
import {useOnboardingInternalState} from '../state'

export function StepFindContactsIntro() {
  const ax = useAnalytics()
  const {_} = useLingui()
  const {dispatch} = useOnboardingInternalState()

  useCallOnce(() => {
    ax.metric('onboarding:contacts:presented', {})
  })()

  const {data: isAvailable, isSuccess} = useQuery({
    queryKey: ['contacts-available'],
    queryFn: async () => await Contacts.isAvailableAsync(),
  })

  return (
    <View style={[a.w_full, a.gap_sm]}>
      <OnboardingPosition />
      <ContactsHeroImage />
      <OnboardingTitleText style={[a.mt_sm]}>
        <Trans>Blacksky is more fun with friends</Trans>
      </OnboardingTitleText>
      <OnboardingDescriptionText>
        <Trans>
          Find your friends on Blacksky by verifying your phone number and
          matching with your contacts. We protect your information and you
          control what happens next.
        </Trans>
      </OnboardingDescriptionText>
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
            label={_(msg`Import contacts`)}
            size="large"
            color="primary"
            disabled={!isAvailable}>
            <ButtonText>
              <Trans>Import contacts</Trans>
            </ButtonText>
          </Button>
          <Button
            onPress={() => dispatch({type: 'next'})}
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

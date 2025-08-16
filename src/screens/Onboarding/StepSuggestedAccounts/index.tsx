import {useCallback, useContext, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useOnboardingDispatch} from '#/state/shell'
import {OnboardingControls} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {SuggestedAccountsTabBar} from '#/screens/Search/modules/ExploreSuggestedAccounts'
import {atoms as a, useBreakpoints} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwise} from '#/components/icons/ArrowRotateCounterClockwise'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function StepSuggestedAccounts() {
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()

  const {dispatch} = useContext(Context)
  const [saving, setSaving] = useState(false)
  const onboardDispatch = useOnboardingDispatch()

  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)

  const saveInterests = useCallback(async () => {
    setSaving(true)

    try {
      setSaving(false)
      dispatch({type: 'next'})
    } catch (e: any) {
      logger.info(`onboading: error saving interests`)
      logger.error(e)
    }
  }, [setSaving, dispatch])

  const skipOnboarding = useCallback(() => {
    onboardDispatch({type: 'finish'})
    dispatch({type: 'finish'})
  }, [onboardDispatch, dispatch])

  const isError = false

  return (
    <View style={[a.align_start]} testID="onboardingInterests">
      <Text style={[a.font_heavy, a.text_3xl]}>
        <Trans>Suggested Accounts</Trans>
      </Text>

      <SuggestedAccountsTabBar
        selectedInterest={selectedInterest}
        onSelectInterest={setSelectedInterest}
      />

      <OnboardingControls.Portal>
        {isError ? (
          <View style={[a.gap_md, gtMobile ? a.flex_row : a.flex_col]}>
            <Button
              // disabled={isFetching}
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Retry`)}
              // onPress={() => refetch()}
            >
              <ButtonText>
                <Trans>Retry</Trans>
              </ButtonText>
              <ButtonIcon icon={ArrowRotateCounterClockwise} position="right" />
            </Button>
            <Button
              variant="outline"
              color="secondary"
              size="large"
              label={_(msg`Skip this flow`)}
              onPress={skipOnboarding}>
              <ButtonText>
                <Trans>Skip</Trans>
              </ButtonText>
            </Button>
          </View>
        ) : (
          <View style={[a.gap_md, gtMobile ? a.flex_row : a.flex_col]}>
            <Button
              disabled={saving}
              color="secondary"
              size="large"
              label={_(msg`Follow all accounts`)}>
              <ButtonText>
                <Trans>Follow all</Trans>
              </ButtonText>
            </Button>
            <Button
              disabled={saving}
              variant="solid"
              color="primary"
              size="large"
              label={_(msg`Continue to next step`)}
              onPress={saveInterests}>
              <ButtonText>
                <Trans>Continue</Trans>
              </ButtonText>
              <ButtonIcon icon={saving ? Loader : ChevronRight} />
            </Button>
          </View>
        )}
      </OnboardingControls.Portal>
    </View>
  )
}

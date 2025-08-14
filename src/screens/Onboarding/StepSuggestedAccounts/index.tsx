import {useCallback, useContext, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {useOnboardingDispatch} from '#/state/shell'
import {
  DescriptionText,
  OnboardingControls,
  TitleText,
} from '#/screens/Onboarding/Layout'
import {Context} from '#/screens/Onboarding/state'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {IconCircle} from '#/components/IconCircle'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwise} from '#/components/icons/ArrowRotateCounterClockwise'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {EmojiSad_Stroke2_Corner0_Rounded as EmojiSad} from '#/components/icons/Emoji'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {Loader} from '#/components/Loader'

export function StepSuggestedAccounts() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const {dispatch} = useContext(Context)
  const [saving, setSaving] = useState(false)
  const onboardDispatch = useOnboardingDispatch()

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

  const title = isError ? (
    <Trans>Oh no! Something went wrong.</Trans>
  ) : (
    <Trans>Suggested Accounts</Trans>
  )
  const description = isError ? (
    <Trans>
      We weren't able to connect. Please try again to continue setting up your
      account. If it continues to fail, you can skip this flow.
    </Trans>
  ) : (
    <Trans>We'll use this to help customize your experience.</Trans>
  )

  return (
    <View style={[a.align_start]} testID="onboardingInterests">
      <IconCircle
        icon={isError ? EmojiSad : Hashtag}
        style={[
          a.mb_2xl,
          isError
            ? {
                backgroundColor: t.palette.negative_50,
              }
            : {},
        ]}
        iconStyle={[
          isError
            ? {
                color: t.palette.negative_900,
              }
            : {},
        ]}
      />

      <TitleText>{title}</TitleText>
      <DescriptionText>{description}</DescriptionText>

      <View style={[a.w_full, a.pt_2xl]} />

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

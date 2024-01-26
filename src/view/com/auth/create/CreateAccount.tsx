import React from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {LoggedOutLayout} from 'view/com/util/layouts/LoggedOutLayout'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useOnboardingDispatch} from '#/state/shell'
import {useSessionApi} from '#/state/session'
import {useCreateAccount, submit} from './state'
import {useServiceQuery} from '#/state/queries/service'
import {
  usePreferencesSetBirthDateMutation,
  useSetSaveFeedsMutation,
  DEFAULT_PROD_FEEDS,
} from '#/state/queries/preferences'
import {FEEDBACK_FORM_URL, HITSLOP_10, IS_PROD} from '#/lib/constants'

import {Step1} from './Step1'
import {Step2} from './Step2'
import {Step3} from './Step3'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {TextLink} from '../../util/Link'

export function CreateAccount({onPressBack}: {onPressBack: () => void}) {
  const {screen} = useAnalytics()
  const pal = usePalette('default')
  const {_} = useLingui()
  const [uiState, uiDispatch] = useCreateAccount()
  const onboardingDispatch = useOnboardingDispatch()
  const {createAccount} = useSessionApi()
  const {mutate: setBirthDate} = usePreferencesSetBirthDateMutation()
  const {mutate: setSavedFeeds} = useSetSaveFeedsMutation()
  const {isTabletOrDesktop} = useWebMediaQueries()

  React.useEffect(() => {
    screen('CreateAccount')
  }, [screen])

  // fetch service info
  // =

  const {
    data: serviceInfo,
    isFetching: serviceInfoIsFetching,
    error: serviceInfoError,
    refetch: refetchServiceInfo,
  } = useServiceQuery(uiState.serviceUrl)

  React.useEffect(() => {
    if (serviceInfo) {
      uiDispatch({type: 'set-service-description', value: serviceInfo})
      uiDispatch({type: 'set-error', value: ''})
    } else if (serviceInfoError) {
      uiDispatch({
        type: 'set-error',
        value: _(
          msg`Unable to contact your service. Please check your Internet connection.`,
        ),
      })
    }
  }, [_, uiDispatch, serviceInfo, serviceInfoError])

  // event handlers
  // =

  const onPressBackInner = React.useCallback(() => {
    if (uiState.canBack) {
      uiDispatch({type: 'back'})
    } else {
      onPressBack()
    }
  }, [uiState, uiDispatch, onPressBack])

  const onPressNext = React.useCallback(async () => {
    if (!uiState.canNext) {
      return
    }
    if (uiState.step < 3) {
      uiDispatch({type: 'next'})
    } else {
      try {
        await submit({
          onboardingDispatch,
          createAccount,
          uiState,
          uiDispatch,
          _,
        })
        setBirthDate({birthDate: uiState.birthDate})
        if (IS_PROD(uiState.serviceUrl)) {
          setSavedFeeds(DEFAULT_PROD_FEEDS)
        }
      } catch {
        // dont need to handle here
      }
    }
  }, [
    uiState,
    uiDispatch,
    onboardingDispatch,
    createAccount,
    setBirthDate,
    setSavedFeeds,
    _,
  ])

  // rendering
  // =

  return (
    <LoggedOutLayout
      leadin=""
      title={_(msg`Create Account`)}
      description={_(msg`We're so excited to have you join us!`)}>
      <ScrollView
        testID="createAccount"
        style={pal.view}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.stepContainer}>
          {uiState.step === 1 && (
            <Step1 uiState={uiState} uiDispatch={uiDispatch} />
          )}
          {uiState.step === 2 && (
            <Step2 uiState={uiState} uiDispatch={uiDispatch} />
          )}
          {uiState.step === 3 && (
            <Step3 uiState={uiState} uiDispatch={uiDispatch} />
          )}
        </View>
        <View style={[s.flexRow, s.pl20, s.pr20]}>
          <TouchableOpacity
            onPress={onPressBackInner}
            testID="backBtn"
            accessibilityRole="button"
            hitSlop={HITSLOP_10}>
            <Text type="xl" style={pal.link}>
              <Trans>Back</Trans>
            </Text>
          </TouchableOpacity>
          <View style={s.flex1} />
          {uiState.canNext ? (
            <TouchableOpacity
              testID="nextBtn"
              onPress={onPressNext}
              accessibilityRole="button"
              hitSlop={HITSLOP_10}>
              {uiState.isProcessing ? (
                <ActivityIndicator />
              ) : (
                <Text type="xl-bold" style={[pal.link, s.pr5]}>
                  <Trans>Next</Trans>
                </Text>
              )}
            </TouchableOpacity>
          ) : serviceInfoError ? (
            <TouchableOpacity
              testID="retryConnectBtn"
              onPress={() => refetchServiceInfo()}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Retry`)}
              accessibilityHint=""
              accessibilityLiveRegion="polite"
              hitSlop={HITSLOP_10}>
              <Text type="xl-bold" style={[pal.link, s.pr5]}>
                <Trans>Retry</Trans>
              </Text>
            </TouchableOpacity>
          ) : serviceInfoIsFetching ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text type="xl" style={[pal.text, s.pr5]}>
                <Trans>Connecting...</Trans>
              </Text>
            </>
          ) : undefined}
        </View>

        <View style={styles.stepContainer}>
          <View
            style={[
              s.flexRow,
              s.alignCenter,
              pal.viewLight,
              {borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12},
            ]}>
            <Text type="md" style={pal.textLight}>
              <Trans>Having trouble?</Trans>{' '}
            </Text>
            <TextLink
              type="md"
              style={pal.link}
              text={_(msg`Contact support`)}
              href={FEEDBACK_FORM_URL({email: uiState.email})}
            />
          </View>
        </View>

        <View style={{height: isTabletOrDesktop ? 50 : 400}} />
      </ScrollView>
    </LoggedOutLayout>
  )
}

const styles = StyleSheet.create({
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
})

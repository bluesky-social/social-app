import React from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useAnalytics} from 'lib/analytics/analytics'
import {Text} from '../../util/text/Text'
import {LoggedOutLayout} from 'view/com/util/layouts/LoggedOutLayout'
import {s} from 'lib/styles'
import {useStores} from 'state/index'
import {CreateAccountModel} from 'state/models/ui/create-account'
import {usePalette} from 'lib/hooks/usePalette'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useOnboardingDispatch} from '#/state/shell'
import {useSessionApi} from '#/state/session'
import {
  usePreferencesSetBirthDateMutation,
  useSetSaveFeedsMutation,
  DEFAULT_PROD_FEEDS,
} from '#/state/queries/preferences'
import {IS_PROD} from '#/lib/constants'

import {Step1} from './Step1'
import {Step2} from './Step2'
import {Step3} from './Step3'

export const CreateAccount = observer(function CreateAccountImpl({
  onPressBack,
}: {
  onPressBack: () => void
}) {
  const {track, screen} = useAnalytics()
  const pal = usePalette('default')
  const store = useStores()
  const model = React.useMemo(() => new CreateAccountModel(store), [store])
  const {_} = useLingui()
  const onboardingDispatch = useOnboardingDispatch()
  const {createAccount} = useSessionApi()
  const {mutate: setBirthDate} = usePreferencesSetBirthDateMutation()
  const {mutate: setSavedFeeds} = useSetSaveFeedsMutation()

  React.useEffect(() => {
    screen('CreateAccount')
  }, [screen])

  React.useEffect(() => {
    model.fetchServiceDescription()
  }, [model])

  const onPressRetryConnect = React.useCallback(
    () => model.fetchServiceDescription(),
    [model],
  )

  const onPressBackInner = React.useCallback(() => {
    if (model.canBack) {
      model.back()
    } else {
      onPressBack()
    }
  }, [model, onPressBack])

  const onPressNext = React.useCallback(async () => {
    if (!model.canNext) {
      return
    }
    if (model.step < 3) {
      model.next()
    } else {
      try {
        await model.submit({
          onboardingDispatch,
          createAccount,
        })

        setBirthDate({birthDate: model.birthDate})

        if (IS_PROD(model.serviceUrl)) {
          setSavedFeeds(DEFAULT_PROD_FEEDS)
        }
      } catch {
        // dont need to handle here
      } finally {
        track('Try Create Account')
      }
    }
  }, [
    model,
    track,
    onboardingDispatch,
    createAccount,
    setBirthDate,
    setSavedFeeds,
  ])

  return (
    <LoggedOutLayout
      leadin={`Step ${model.step}`}
      title={_(msg`Create Account`)}
      description={_(msg`We're so excited to have you join us!`)}>
      <ScrollView testID="createAccount" style={pal.view}>
        <KeyboardAvoidingView behavior="padding">
          <View style={styles.stepContainer}>
            {model.step === 1 && <Step1 model={model} />}
            {model.step === 2 && <Step2 model={model} />}
            {model.step === 3 && <Step3 model={model} />}
          </View>
          <View style={[s.flexRow, s.pl20, s.pr20]}>
            <TouchableOpacity
              onPress={onPressBackInner}
              testID="backBtn"
              accessibilityRole="button">
              <Text type="xl" style={pal.link}>
                <Trans>Back</Trans>
              </Text>
            </TouchableOpacity>
            <View style={s.flex1} />
            {model.canNext ? (
              <TouchableOpacity
                testID="nextBtn"
                onPress={onPressNext}
                accessibilityRole="button">
                {model.isProcessing ? (
                  <ActivityIndicator />
                ) : (
                  <Text type="xl-bold" style={[pal.link, s.pr5]}>
                    <Trans>Next</Trans>
                  </Text>
                )}
              </TouchableOpacity>
            ) : model.didServiceDescriptionFetchFail ? (
              <TouchableOpacity
                testID="retryConnectBtn"
                onPress={onPressRetryConnect}
                accessibilityRole="button"
                accessibilityLabel={_(msg`Retry`)}
                accessibilityHint="Retries account creation"
                accessibilityLiveRegion="polite">
                <Text type="xl-bold" style={[pal.link, s.pr5]}>
                  <Trans>Retry</Trans>
                </Text>
              </TouchableOpacity>
            ) : model.isFetchingServiceDescription ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text type="xl" style={[pal.text, s.pr5]}>
                  <Trans>Connecting...</Trans>
                </Text>
              </>
            ) : undefined}
          </View>
          <View style={s.footerSpacer} />
        </KeyboardAvoidingView>
      </ScrollView>
    </LoggedOutLayout>
  )
})

const styles = StyleSheet.create({
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
})

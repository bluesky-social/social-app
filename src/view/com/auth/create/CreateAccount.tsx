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
import {useCreateAccount, useSubmitCreateAccount} from './state'
import {useServiceQuery} from '#/state/queries/service'
import {FEEDBACK_FORM_URL, HITSLOP_10} from '#/lib/constants'

import {Step1} from './Step1'
import {Step2} from './Step2'
import {Step3} from './Step3'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {TextLink} from '../../util/Link'
import {getAgent} from 'state/session'
import {createFullHandle, validateHandle} from 'lib/strings/handles'

export function CreateAccount({onPressBack}: {onPressBack: () => void}) {
  const {screen} = useAnalytics()
  const pal = usePalette('default')
  const {_} = useLingui()
  const [uiState, uiDispatch] = useCreateAccount()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const submit = useSubmitCreateAccount(uiState, uiDispatch)

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

    if (uiState.step === 2) {
      if (!validateHandle(uiState.handle, uiState.userDomain).overall) {
        return
      }

      uiDispatch({type: 'set-processing', value: true})
      try {
        const res = await getAgent().resolveHandle({
          handle: createFullHandle(uiState.handle, uiState.userDomain),
        })

        if (res.data.did) {
          uiDispatch({
            type: 'set-error',
            value: _(msg`That handle is already taken.`),
          })
          return
        }
      } catch (e) {
        // Don't need to handle
      } finally {
        uiDispatch({type: 'set-processing', value: false})
      }

      if (!uiState.isCaptchaRequired) {
        try {
          await submit()
        } catch {
          // dont need to handle here
        }
        // We don't need to go to the next page if there wasn't a captcha required
        return
      }
    }

    uiDispatch({type: 'next'})
  }, [
    uiState.canNext,
    uiState.step,
    uiState.isCaptchaRequired,
    uiState.handle,
    uiState.userDomain,
    uiDispatch,
    _,
    submit,
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

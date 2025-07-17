import {useState} from 'react'
import {View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {BSKY_SERVICE_HANDLE_ENDSWITH} from '#/lib/constants'
import {
  createFullHandle,
  isHandleReserved,
  MAX_SERVICE_HANDLE_LENGTH,
  validateServiceHandle,
} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useHandleAvailabilityQuery} from '#/state/queries/handle-availablility'
import {useAgent} from '#/state/session'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a, native, useTheme} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {Text} from '#/components/Typography'
import {BackNextButtons} from './BackNextButtons'

export function StepHandle() {
  const {_} = useLingui()
  const {state, dispatch} = useSignupContext()
  const agent = useAgent()
  const [draftValue, setDraftValue] = useState(state.handle)
  const isNextLoading = useThrottledValue(state.isLoading, 500)

  const validCheck = validateServiceHandle(draftValue, state.userDomain)

  const {data: isHandleAvailable, isLoading} = useHandleAvailabilityQuery(
    draftValue,
    state.userDomain,
    validCheck.overall,
  )

  const onNextPress = async () => {
    if (!isHandleAvailable?.available) return

    const handle = draftValue.trim()
    dispatch({
      type: 'setHandle',
      value: handle,
    })

    if (!validCheck.overall) {
      return
    }

    if (
      state.userDomain === BSKY_SERVICE_HANDLE_ENDSWITH &&
      isHandleReserved(handle)
    ) {
      dispatch({
        type: 'setError',
        value: _(msg`That username is not available`),
        field: 'handle',
      })
      logger.metric('signup:handleReserved', {}, {statsig: true})
      return
    }

    try {
      dispatch({type: 'setIsLoading', value: true})

      const res = await agent.resolveHandle({
        handle: createFullHandle(handle, state.userDomain),
      })

      if (res.data.did) {
        dispatch({
          type: 'setError',
          value: _(msg`That username is already taken`),
          field: 'handle',
        })
        logger.metric('signup:handleTaken', {}, {statsig: true})
        return
      }
    } catch (e) {
      // Don't have to handle
    } finally {
      dispatch({type: 'setIsLoading', value: false})
    }

    logger.metric(
      'signup:nextPressed',
      {
        activeStep: state.activeStep,
        phoneVerificationRequired:
          state.serviceDescription?.phoneVerificationRequired,
      },
      {statsig: true},
    )
    // phoneVerificationRequired is actually whether a captcha is required
    if (!state.serviceDescription?.phoneVerificationRequired) {
      dispatch({
        type: 'submit',
        task: {verificationCode: undefined, mutableProcessed: false},
      })
      return
    }
    dispatch({type: 'next'})
  }

  const onBackPress = () => {
    const handle = draftValue.trim()
    dispatch({
      type: 'setHandle',
      value: handle,
    })
    dispatch({type: 'prev'})
    logger.metric(
      'signup:backPressed',
      {activeStep: state.activeStep},
      {statsig: true},
    )
  }

  const textFieldInvalid =
    (!isLoading && isHandleAvailable && !isHandleAvailable.available) ||
    !validCheck.frontLengthNotTooLong ||
    !validCheck.handleChars ||
    !validCheck.hyphenStartOrEnd ||
    !validCheck.totalLength

  return (
    <ScreenTransition>
      <View style={[a.gap_sm, a.pt_lg]}>
        <View>
          <TextField.Root isInvalid={textFieldInvalid}>
            <TextField.Icon icon={AtIcon} />
            <TextField.Input
              testID="handleInput"
              onChangeText={val => {
                if (state.error) {
                  dispatch({type: 'setError', value: ''})
                }
                setDraftValue(val)
              }}
              label={state.userDomain}
              defaultValue={draftValue}
              keyboardType="ascii-capable" // fix for iOS replacing -- with —
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              autoComplete="off"
            />
            {draftValue.length > 0 && (
              <TextField.GhostText value={state.userDomain}>
                {draftValue}
              </TextField.GhostText>
            )}
          </TextField.Root>
        </View>
        <LayoutAnimationConfig skipEntering skipExiting>
          <View style={[a.gap_xs]}>
            {state.error && (
              <Requirement>
                <RequirementText>{state.error}</RequirementText>
              </Requirement>
            )}
            {isHandleAvailable &&
              !isHandleAvailable.available &&
              validCheck.overall && (
                <Requirement>
                  <RequirementText>
                    {isHandleAvailable?.reason === 'taken' ? (
                      <Trans>
                        {createFullHandle(draftValue, state.userDomain)} is
                        taken
                      </Trans>
                    ) : (
                      <Trans>
                        {createFullHandle(draftValue, state.userDomain)} is
                        invalid
                      </Trans>
                    )}
                  </RequirementText>
                </Requirement>
              )}
            {(!validCheck.handleChars || !validCheck.hyphenStartOrEnd) && (
              <Requirement>
                {!validCheck.hyphenStartOrEnd ? (
                  <RequirementText>
                    <Trans>Doesn't begin or end with a hyphen</Trans>
                  </RequirementText>
                ) : (
                  <RequirementText>
                    <Trans>Only contains letters, numbers, and hyphens</Trans>
                  </RequirementText>
                )}
              </Requirement>
            )}
            <Requirement>
              {(!validCheck.frontLengthNotTooLong ||
                !validCheck.totalLength) && (
                <RequirementText>
                  <Trans>
                    No longer than{' '}
                    <Plural
                      value={MAX_SERVICE_HANDLE_LENGTH}
                      other="# characters"
                    />
                  </Trans>
                </RequirementText>
              )}
            </Requirement>
          </View>
        </LayoutAnimationConfig>
      </View>
      <BackNextButtons
        isLoading={isNextLoading}
        isNextDisabled={!validCheck.overall || !!state.error}
        onBackPress={onBackPress}
        onNextPress={onNextPress}
      />
    </ScreenTransition>
  )
}

function Requirement({children}: {children: React.ReactNode}) {
  return (
    <Animated.View
      style={[a.w_full]}
      layout={native(LinearTransition)}
      entering={native(FadeIn)}
      exiting={native(FadeOut)}>
      {children}
    </Animated.View>
  )
}

function RequirementText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text style={[a.text_sm, a.flex_1, {color: t.palette.negative_500}]}>
      <Trans>{children}</Trans>
    </Text>
  )
}

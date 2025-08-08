import React, {useRef} from 'react'
import {View} from 'react-native'
import Svg, {Path} from 'react-native-svg'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  createFullHandle,
  MAX_SERVICE_HANDLE_LENGTH,
  validateServiceHandle,
} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

// RedWrong icon component
function RedWrongIcon() {
  return (
    <Svg width={10} height={11} viewBox="0 0 10 11" fill="none">
      <Path
        d="M9.22316 1.27679L0.776733 9.72322"
        stroke="#C30B0D"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M0.776733 1.27679L9.22316 9.72322"
        stroke="#C30B0D"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// CheckCorrect icon component
function CheckCorrectIcon() {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13" fill="none">
      <Path
        d="M1.00891 8.03572L3.48302 10.2005C3.80966 10.4864 4.30809 10.4449 4.58294 10.1089L10.9911 2.27679"
        stroke="black"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function StepGandle() {
  const {_} = useLingui()
  const {state, dispatch} = useSignupContext()
  const agent = useAgent()
  const handleValueRef = useRef<string>(state.handle)
  const [draftValue, setDraftValue] = React.useState('@' + state.handle)
  const isLoading = useThrottledValue(state.isLoading, 500)

  const onNextPress = React.useCallback(async () => {
    const handle = handleValueRef.current.trim()
    dispatch({
      type: 'setHandle',
      value: handle,
    })

    const newValidCheck = validateServiceHandle(handle, state.userDomain)
    if (!newValidCheck.overall) {
      return
    }

    try {
      dispatch({type: 'setIsLoading', value: true})

      // TODO: Temporary fix - hardcoded domain should be replaced with proper domain configuration
      const res = await agent.resolveHandle({
        handle: createFullHandle(handle, 'gander.social'),
      })

      if (res.data.did) {
        dispatch({
          type: 'setError',
          value: _(msg`That handle is already taken.`),
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
  }, [
    _,
    dispatch,
    state.activeStep,
    state.serviceDescription?.phoneVerificationRequired,
    state.userDomain,
    agent,
  ])

  const onBackPress = React.useCallback(() => {
    const handle = handleValueRef.current.trim()
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
  }, [dispatch, state.activeStep])

  // TODO: Temporary fix - hardcoded domain should be replaced with proper domain configuration
  const validCheck = validateServiceHandle(
    draftValue.substring(1),
    'gander.social',
  )
  return (
    <ScreenTransition>
      <View style={[a.gap_lg]}>
        <View>
          <TextField.Root>
            <TextField.Input
              testID="handleInput"
              onChangeText={val => {
                if (state.error) {
                  dispatch({type: 'setError', value: ''})
                }

                // Ensure @ is always at the beginning and cannot be removed
                let processedValue = val
                if (!val.startsWith('@')) {
                  processedValue = '@' + val.replace('@', '')
                }

                // These need to always be in sync.
                handleValueRef.current = processedValue.substring(1) // Remove @ for storage
                setDraftValue(processedValue)
              }}
              label={_(msg`Username`)}
              defaultValue={draftValue}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              autoComplete="off"
            />
          </TextField.Root>
        </View>
        {draftValue !== '@' && (
          <View style={[a.mt_sm, a.gap_xs]}>
            {state.error && (
              <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                <RedWrongIcon />
                <Text style={[a.text_sm, {color: '#C30B0D'}]}>
                  {state.error}
                </Text>
              </View>
            )}
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <CheckCorrectIcon />
              <Text
                style={[
                  a.text_sm,
                  {
                    color: validCheck.handleChars ? '#696969' : '#AAAAAA',
                  },
                ]}>
                <Trans>Only contains letters, numbers, and hyphens</Trans>
              </Text>
            </View>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <CheckCorrectIcon />
              <Text
                style={[
                  a.text_sm,
                  {
                    color: validCheck.hyphenStartOrEnd ? '#696969' : '#AAAAAA',
                  },
                ]}>
                <Trans>Doesn't begin or end with a hyphen</Trans>
              </Text>
            </View>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <CheckCorrectIcon />
              <Text
                style={[
                  a.text_sm,
                  {
                    color:
                      validCheck.frontLength && validCheck.totalLength
                        ? '#696969'
                        : '#AAAAAA',
                  },
                ]}>
                {!validCheck.totalLength ||
                draftValue.substring(1).length > MAX_SERVICE_HANDLE_LENGTH ? (
                  <Trans>
                    No longer than{' '}
                    <Plural
                      value={MAX_SERVICE_HANDLE_LENGTH}
                      other="# characters"
                    />
                  </Trans>
                ) : (
                  <Trans>At least 3 characters</Trans>
                )}
              </Text>
            </View>
          </View>
        )}
        {draftValue !== '@' && (
          <View>
            <Text style={[{fontSize: 17, fontWeight: 400, lineHeight: 21}]}>
              <Trans>Your full username will be:</Trans>
            </Text>
            {/* TODO: Temporary fix - hardcoded domain should be replaced with proper domain configuration */}
            <Text style={[{fontSize: 17, fontWeight: 700, lineHeight: 21}]}>
              @{createFullHandle(draftValue.substring(1), 'gander.social')}
            </Text>
          </View>
        )}
      </View>
      <View
        style={[a.border_t, a.mt_lg, {borderColor: '#D8D8D8', borderWidth: 1}]}
      />
      <View style={[a.flex_row, a.align_center, a.pt_lg]}>
        <Button
          label={_(msg`Cancel`)}
          variant="solid"
          color="secondary"
          size="large"
          onPress={onBackPress}>
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
        <View style={a.flex_1} />
        <Button
          testID="nextBtn"
          label={_(msg`Continue to next step`)}
          accessibilityHint={_(msg`Continues to next step`)}
          variant="solid"
          color="primary"
          size="large"
          disabled={!validCheck.overall || isLoading}
          onPress={onNextPress}>
          <ButtonText>
            <Trans>Next</Trans>
          </ButtonText>
          {isLoading && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </ScreenTransition>
  )
}

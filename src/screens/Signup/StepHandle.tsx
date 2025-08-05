import {useState} from 'react'
import {View} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {type ComAtprotoTempCheckHandleAvailability} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  createFullHandle,
  MAX_SERVICE_HANDLE_LENGTH,
  validateServiceHandle,
} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {
  checkHandleAvailability,
  useHandleAvailabilityQuery,
} from '#/state/queries/handle-availability'
import {useAgent} from '#/state/session'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a, native, useTheme} from '#/alf'
import {borderRadius} from '#/alf/tokens'
import {Button} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {At_Stroke2_Corner0_Rounded as AtIcon} from '#/components/icons/At'
import {Check_Stroke2_Corner0_Rounded as CheckIcon} from '#/components/icons/Check'
import {Text} from '#/components/Typography'
import {BackNextButtons} from './BackNextButtons'

export function StepHandle() {
  const {_} = useLingui()
  const t = useTheme()
  const {state, dispatch} = useSignupContext()
  const agent = useAgent()
  const [draftValue, setDraftValue] = useState(state.handle)
  const isNextLoading = useThrottledValue(state.isLoading, 500)

  const validCheck = validateServiceHandle(draftValue, state.userDomain)

  const {
    enabled: queryEnabled,
    query: {data: isHandleAvailable, isPending},
  } = useHandleAvailabilityQuery({
    username: draftValue,
    serviceDid: state.serviceDescription?.did ?? 'UNKNOWN',
    serviceDomain: state.userDomain,
    birthDate: state.dateOfBirth.toISOString(),
    email: state.email,
    enabled: validCheck.overall,
  })

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

    dispatch({type: 'setIsLoading', value: true})

    try {
      const {available: handleAvailable} = await checkHandleAvailability(
        agent,
        handle,
        state.serviceDescription?.did ?? 'UNKNOWN',
        {typeahead: false},
      )

      if (!handleAvailable) {
        dispatch({
          type: 'setError',
          value: _(msg`That username is already taken`),
          field: 'handle',
        })
        return
      }
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

  const isHandleTaken =
    !isPending &&
    queryEnabled &&
    isHandleAvailable &&
    !isHandleAvailable.available

  const textFieldInvalid =
    isHandleTaken ||
    !validCheck.frontLengthNotTooLong ||
    !validCheck.handleChars ||
    !validCheck.hyphenStartOrEnd ||
    !validCheck.totalLength

  return (
    <ScreenTransition>
      <View style={[a.gap_sm, a.pt_lg, a.z_10]}>
        <View>
          <TextField.Root isInvalid={textFieldInvalid}>
            <TextField.Icon icon={AtIcon} />
            <TextField.Input
              testID="handleInput"
              onChangeText={val => {
                if (state.error) {
                  dispatch({type: 'setError', value: ''})
                }
                setDraftValue(val.toLocaleLowerCase())
              }}
              label={state.userDomain}
              value={draftValue}
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
            {isHandleAvailable?.available && (
              <CheckIcon style={[{color: t.palette.positive_600}, a.z_20]} />
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
            {isHandleTaken && validCheck.overall && (
              <>
                <Requirement>
                  <RequirementText>
                    <Trans>
                      {createFullHandle(draftValue, state.userDomain)} is not
                      available
                    </Trans>
                  </RequirementText>
                </Requirement>
                {isHandleAvailable.suggestions &&
                  isHandleAvailable.suggestions.length > 0 && (
                    <HandleSuggestions
                      suggestions={isHandleAvailable.suggestions}
                      onSelect={suggestion => {
                        setDraftValue(
                          suggestion.handle.slice(
                            0,
                            state.userDomain.length * -1,
                          ),
                        )
                        logger.metric('signup:handleSuggestionSelected', {
                          method: suggestion.method,
                        })
                      }}
                    />
                  )}
              </>
            )}
            {(!validCheck.handleChars || !validCheck.hyphenStartOrEnd) && (
              <Requirement>
                {!validCheck.hyphenStartOrEnd ? (
                  <RequirementText>
                    <Trans>Username cannot begin or end with a hyphen</Trans>
                  </RequirementText>
                ) : (
                  <RequirementText>
                    <Trans>
                      Username must only contain letters (a-z), numbers, and
                      hyphens
                    </Trans>
                  </RequirementText>
                )}
              </Requirement>
            )}
            <Requirement>
              {(!validCheck.frontLengthNotTooLong ||
                !validCheck.totalLength) && (
                <RequirementText>
                  <Trans>
                    Username cannot be longer than{' '}
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
      <Animated.View layout={native(LinearTransition)}>
        <BackNextButtons
          isLoading={isNextLoading}
          isNextDisabled={!validCheck.overall || !!state.error || isHandleTaken}
          onBackPress={onBackPress}
          onNextPress={onNextPress}
        />
      </Animated.View>
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
      {children}
    </Text>
  )
}

function HandleSuggestions({
  suggestions,
  onSelect,
}: {
  suggestions: ComAtprotoTempCheckHandleAvailability.Suggestion[]
  onSelect: (
    suggestions: ComAtprotoTempCheckHandleAvailability.Suggestion,
  ) => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Animated.View
      entering={native(FadeInDown.easing(Easing.out(Easing.exp)))}
      exiting={native(FadeOut)}
      style={[
        a.flex_1,
        a.border,
        a.rounded_sm,
        t.atoms.shadow_sm,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.mt_xs,
        a.z_50,
        a.w_full,
        a.zoom_fade_in,
      ]}>
      {suggestions.map((suggestion, index) => (
        <Button
          label={_(
            msg({
              message: `Select ${suggestion.handle}`,
              comment: `Accessibility label for a username suggestion in the account creation flow`,
            }),
          )}
          key={index}
          onPress={() => onSelect(suggestion)}
          hoverStyle={[t.atoms.bg_contrast_25]}
          style={[
            a.w_full,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.p_md,
            a.border_b,
            t.atoms.border_contrast_low,
            index === 0 && {
              borderTopStartRadius: borderRadius.sm,
              borderTopEndRadius: borderRadius.sm,
            },
            index === suggestions.length - 1 && [
              {
                borderBottomStartRadius: borderRadius.sm,
                borderBottomEndRadius: borderRadius.sm,
              },
              a.border_b_0,
            ],
          ]}>
          <Text style={[a.text_md]}>{suggestion.handle}</Text>
          <Text style={[a.text_sm, {color: t.palette.positive_700}]}>
            <Trans comment="Shown next to an available username suggestion in the account creation flow">
              Available
            </Trans>
          </Text>
        </Button>
      ))}
    </Animated.View>
  )
}

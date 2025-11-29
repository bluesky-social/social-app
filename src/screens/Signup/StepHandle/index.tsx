import React, {useState} from 'react'
import {View} from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from 'react-native-reanimated'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGate} from '#/lib/statsig/statsig'
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
import {ScreenTransition} from '#/components/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown} from '#/components/icons/Chevron'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {IS_INTERNAL} from '#/env'
import {BackNextButtons} from '../BackNextButtons'
import {HandleSuggestions} from './HandleSuggestions'

export function StepHandle() {
  const {_} = useLingui()
  const t = useTheme()
  const gate = useGate()
  const {state, dispatch} = useSignupContext()
  const [draftValue, setDraftValue] = useState(state.handle)
  const [selectedDomain, setSelectedDomain] = useState(
    state.userDomain ||
      state.serviceDescription?.availableUserDomains?.[0] ||
      '',
  )
  const isNextLoading = useThrottledValue(state.isLoading, 500)

  // Get available domains from service description
  const availableDomains = React.useMemo(
    () => state.serviceDescription?.availableUserDomains || [],
    [state.serviceDescription?.availableUserDomains],
  )
  const hasMultipleDomains = React.useMemo(
    () => availableDomains.length > 1,
    [availableDomains],
  )

  const validCheck = validateServiceHandle(draftValue, selectedDomain)

  // Real-time handle availability checking
  const {
    debouncedUsername: debouncedDraftValue,
    enabled: queryEnabled,
    query: {data: isHandleAvailable, isPending},
  } = useHandleAvailabilityQuery({
    username: draftValue,
    serviceDid: state.serviceDescription?.did ?? 'UNKNOWN',
    serviceDomain: selectedDomain,
    birthDate: state.dateOfBirth.toISOString(),
    email: state.email,
    enabled: validCheck.overall,
  })

  // Calculate disabled state based on real-time checking
  const hasDebounceSettled = draftValue === debouncedDraftValue
  const isHandleTaken =
    !isPending &&
    queryEnabled &&
    isHandleAvailable &&
    !isHandleAvailable.available
  const isNotReady = isPending || !hasDebounceSettled
  const isNextDisabled =
    !validCheck.overall || !!state.error || isNotReady ? true : isHandleTaken

  const textFieldInvalid =
    isHandleTaken ||
    !validCheck.frontLengthNotTooLong ||
    !validCheck.handleChars ||
    !validCheck.hyphenStartOrEnd ||
    !validCheck.totalLength

  const onNextPress = async () => {
    const handle = draftValue.trim()

    // Save both handle and domain to state
    dispatch({
      type: 'setHandle',
      value: handle,
    })
    dispatch({
      type: 'setUserDomain',
      value: selectedDomain,
    })

    if (!validCheck.overall) {
      return
    }

    dispatch({type: 'setIsLoading', value: true})

    try {
      const {available: handleAvailable} = await checkHandleAvailability(
        createFullHandle(handle, selectedDomain),
        state.serviceDescription?.did ?? 'UNKNOWN',
        {typeahead: false},
      )

      if (!handleAvailable) {
        dispatch({
          type: 'setError',
          value: _(msg`That handle is already taken.`),
          field: 'handle',
        })
        return
      }
    } catch (error) {
      logger.error('Failed to check handle availability on next press', {
        safeMessage: error,
      })
      // Don't block on error - let them proceed
    } finally {
      dispatch({type: 'setIsLoading', value: false})
    }

    logger.metric(
      'signup:nextPressed',
      {
        activeStep: state.activeStep,
        phoneVerificationRequired:
          state.serviceDescription?.phoneVerificationRequired,
        selectedDomain,
        isDefaultDomain: selectedDomain === availableDomains[0],
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
    dispatch({
      type: 'setUserDomain',
      value: selectedDomain,
    })
    dispatch({type: 'prev'})
    logger.metric(
      'signup:backPressed',
      {activeStep: state.activeStep},
      {statsig: true},
    )
  }

  return (
    <ScreenTransition direction={state.screenTransitionDirection}>
      <View style={[a.gap_sm, a.pt_lg, a.z_10]}>
        <View>
          <TextField.Root isInvalid={textFieldInvalid}>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="handleInput"
              onChangeText={val => {
                if (state.error) {
                  dispatch({type: 'setError', value: ''})
                }
                setDraftValue(val.toLowerCase())
              }}
              label={selectedDomain}
              value={draftValue}
              keyboardType="ascii-capable" // fix for iOS replacing -- with —
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              autoComplete="off"
            />
            {draftValue.length > 0 && (
              <TextField.GhostText value={selectedDomain}>
                {draftValue}
              </TextField.GhostText>
            )}
            {isHandleAvailable?.available && draftValue.length > 0 && (
              <Check size="md" style={{color: t.palette.positive_600}} />
            )}
          </TextField.Root>

          {/* Domain selector - only shown if multiple domains are available */}
          {hasMultipleDomains && (
            <View style={[a.mt_md]}>
              <Text style={[a.text_sm, a.mb_xs, t.atoms.text_contrast_medium]}>
                <Trans>Domain</Trans>
              </Text>
              <Menu.Root>
                <Menu.Trigger label={_(msg`Select domain`)}>
                  {({props}) => (
                    <Button
                      {...props}
                      label={_(msg`Select domain`)}
                      variant="solid"
                      color="secondary"
                      size="large"
                      style={[
                        a.flex_row,
                        a.align_center,
                        a.justify_between,
                        a.w_full,
                      ]}>
                      <View style={[a.flex_1, a.align_start]}>
                        <ButtonText style={[a.text_md, a.font_bold]}>
                          {selectedDomain}
                        </ButtonText>
                        {selectedDomain === availableDomains[0] && (
                          <Text
                            style={[a.text_xs, t.atoms.text_contrast_medium]}>
                            <Trans>Default</Trans>
                          </Text>
                        )}
                      </View>
                      <ButtonIcon icon={ChevronDown} />
                    </Button>
                  )}
                </Menu.Trigger>

                <Menu.Outer>
                  <Menu.Group>
                    {availableDomains.map((domain, index) => (
                      <Menu.Item
                        key={domain}
                        label={domain}
                        onPress={() => setSelectedDomain(domain)}>
                        <Menu.ItemText>
                          <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                            <Text>{domain}</Text>
                            {index === 0 && (
                              <Text
                                style={[
                                  a.text_xs,
                                  t.atoms.text_contrast_medium,
                                ]}>
                                (<Trans>Default</Trans>)
                              </Text>
                            )}
                          </View>
                        </Menu.ItemText>
                        {selectedDomain === domain && (
                          <Menu.ItemIcon icon={Check} />
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Group>
                </Menu.Outer>
              </Menu.Root>
            </View>
          )}
        </View>

        {/* Validation messages with animations */}
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
                      {createFullHandle(draftValue, selectedDomain)} is not
                      available
                    </Trans>
                  </RequirementText>
                </Requirement>
                {isHandleAvailable?.suggestions &&
                  isHandleAvailable.suggestions.length > 0 &&
                  (gate('handle_suggestions') || IS_INTERNAL) && (
                    <HandleSuggestions
                      suggestions={isHandleAvailable.suggestions}
                      onSelect={suggestion => {
                        // Extract just the handle part without the domain
                        const handlePart = suggestion.handle.includes('.')
                          ? suggestion.handle.split('.')[0]
                          : suggestion.handle.slice(
                              0,
                              selectedDomain.length * -1,
                            )
                        setDraftValue(handlePart)
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
            {(!validCheck.frontLengthNotTooLong || !validCheck.totalLength) && (
              <Requirement>
                <RequirementText>
                  {!validCheck.totalLength ||
                  draftValue.length > MAX_SERVICE_HANDLE_LENGTH ? (
                    <Trans>
                      Username cannot be longer than{' '}
                      <Plural
                        value={MAX_SERVICE_HANDLE_LENGTH}
                        other="# characters"
                      />
                    </Trans>
                  ) : (
                    <Trans>Username must be at least 3 characters</Trans>
                  )}
                </RequirementText>
              </Requirement>
            )}
          </View>
        </LayoutAnimationConfig>
      </View>

      <Animated.View layout={native(LinearTransition)}>
        <BackNextButtons
          isLoading={isNextLoading}
          isNextDisabled={isNextDisabled}
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

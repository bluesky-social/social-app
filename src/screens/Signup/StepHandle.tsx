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

import {
  createFullHandle,
  isHandleReserved,
  MAX_SERVICE_HANDLE_LENGTH,
  validateServiceHandle,
} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useHandleAvailabilityQuery} from '#/state/queries/handle-availablility'
import {useAgent} from '#/state/session'
import {ScreenTransition} from '#/screens/Login/ScreenTransition'
import {useSignupContext} from '#/screens/Signup/state'
import {atoms as a, platform, tokens, useTheme, web} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Circle_Stroke2_Corner0_Rounded as CircleIcon} from '#/components/icons/Circle'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {Loader} from '#/components/Loader'
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

    if (isHandleReserved(handle)) {
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

  return (
    <ScreenTransition>
      <View style={[a.gap_lg]}>
        <Text style={[a.text_sm]}>
          <Trans>This can be changed at any time.</Trans>
        </Text>
        <View>
          <TextField.LabelText>
            <Trans>Username</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="handleInput"
              onChangeText={val => {
                if (state.error) {
                  dispatch({type: 'setError', value: ''})
                }
                // replace em dash with double hyphen to fix iOS behaviour
                setDraftValue(val.replaceAll('—', '--'))
              }}
              label="alice.bsky.social"
              defaultValue={draftValue}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              autoComplete="off"
            />

            {draftValue.length > 0 && (
              <GhostText value={state.userDomain}>{draftValue}</GhostText>
            )}
          </TextField.Root>
        </View>
        <LayoutAnimationConfig skipEntering skipExiting>
          <View style={[a.gap_sm]}>
            {state.error && (
              <Requirement fade>
                <RequirementIcon state="invalid" />
                <RequirementText>{state.error}</RequirementText>
              </Requirement>
            )}
            {(isHandleAvailable || isLoading) && validCheck.overall && (
              <Requirement fade>
                <RequirementIcon
                  state={
                    isLoading
                      ? 'loading'
                      : isHandleAvailable?.available
                        ? 'valid'
                        : 'invalid'
                  }
                />
                <RequirementText>
                  {isLoading ? (
                    <Trans>Checking...</Trans>
                  ) : isHandleAvailable?.available ? (
                    <Trans>Available!</Trans>
                  ) : isHandleAvailable?.reason === 'taken' ? (
                    <Trans>Taken</Trans>
                  ) : (
                    <Trans>Invalid</Trans>
                  )}
                </RequirementText>
              </Requirement>
            )}
            <Requirement>
              <RequirementIcon
                state={
                  validCheck.handleChars && validCheck.hyphenStartOrEnd
                    ? !validCheck.frontLengthLongEnough
                      ? 'initial'
                      : 'valid'
                    : 'invalid'
                }
              />

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
            <Requirement>
              <RequirementIcon
                state={
                  !validCheck.frontLengthLongEnough
                    ? 'initial'
                    : validCheck.frontLengthNotTooLong && validCheck.totalLength
                      ? 'valid'
                      : 'invalid'
                }
              />
              {!validCheck.frontLengthNotTooLong || !validCheck.totalLength ? (
                <RequirementText>
                  <Trans>
                    No longer than{' '}
                    <Plural
                      value={MAX_SERVICE_HANDLE_LENGTH}
                      other="# characters"
                    />
                  </Trans>
                </RequirementText>
              ) : (
                <RequirementText>
                  <Trans>At least 3 characters</Trans>
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

function Requirement({
  children,
  fade,
}: {
  children: React.ReactNode
  fade?: boolean
}) {
  return (
    <Animated.View
      style={[a.w_full, a.flex_row, a.align_center, a.gap_sm]}
      layout={isNative ? LinearTransition : undefined}
      entering={fade && isNative ? FadeIn : undefined}
      exiting={fade && isNative ? FadeOut : undefined}>
      {children}
    </Animated.View>
  )
}

function RequirementText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text style={[a.text_sm, a.flex_1, t.atoms.text_contrast_medium]}>
      <Trans>{children}</Trans>
    </Text>
  )
}

function RequirementIcon({
  state,
}: {
  state: 'initial' | 'valid' | 'invalid' | 'loading'
}) {
  const t = useTheme()

  switch (state) {
    case 'initial':
      return <CircleIcon size="sm" style={t.atoms.text_contrast_low} />
    case 'valid':
      return (
        <CircleCheckIcon size="sm" style={{color: t.palette.positive_700}} />
      )
    case 'invalid':
      return <CircleXIcon size="sm" style={{color: t.palette.negative_500}} />
    case 'loading':
      return <Loader size="sm" style={t.atoms.text_contrast_low} />
  }
}

function GhostText({children, value}: {children: string; value: string}) {
  const t = useTheme()
  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <View
      style={[
        a.pointer_events_none,
        a.absolute,
        a.z_10,
        {
          paddingLeft: platform({
            native:
              // input padding
              tokens.space.md +
              // icon
              tokens.space.xl +
              // icon padding
              tokens.space.xs +
              // text input padding
              tokens.space.xs,
            web:
              // icon
              tokens.space.xl +
              // icon padding
              tokens.space.xs +
              // text input padding
              tokens.space.xs,
          }),
        },
        web(a.pr_md),
        a.overflow_hidden,
        a.max_w_full,
      ]}
      aria-hidden={true}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Text
        style={[
          {color: 'transparent'},
          a.text_md,
          {lineHeight: a.text_md.fontSize * 1.1875},
          a.w_full,
        ]}
        numberOfLines={1}>
        {children}
        <Text
          style={[
            t.atoms.text_contrast_low,
            a.text_md,
            {lineHeight: a.text_md.fontSize * 1.1875},
          ]}>
          {value}
        </Text>
      </Text>
    </View>
  )
}

import React, {useCallback} from 'react'
import {LayoutAnimation} from 'react-native'
import {
  ComAtprotoServerCreateAccount,
  ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import * as EmailValidator from 'email-validator'

import {DEFAULT_SERVICE, IS_PROD_SERVICE} from '#/lib/constants'
import {cleanError} from '#/lib/strings/errors'
import {createFullHandle, validateHandle} from '#/lib/strings/handles'
import {getAge} from '#/lib/strings/time'
import {logger} from '#/logger'
import {
  DEFAULT_PROD_FEEDS,
  usePreferencesSetBirthDateMutation,
  useSetSaveFeedsMutation,
} from '#/state/queries/preferences'
import {useSessionApi} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'

export type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

const DEFAULT_DATE = new Date(Date.now() - 60e3 * 60 * 24 * 365 * 20) // default to 20 years ago

export enum SignupStep {
  INFO,
  HANDLE,
  CAPTCHA,
}

export type SignupState = {
  hasPrev: boolean
  canNext: boolean
  activeStep: SignupStep

  serviceUrl: string
  serviceDescription?: ServiceDescription
  userDomain: string
  dateOfBirth: Date
  email: string
  password: string
  inviteCode: string
  handle: string

  error: string
  isLoading: boolean
}

export type SignupAction =
  | {type: 'prev'}
  | {type: 'next'}
  | {type: 'finish'}
  | {type: 'setStep'; value: SignupStep}
  | {type: 'setServiceUrl'; value: string}
  | {type: 'setServiceDescription'; value: ServiceDescription | undefined}
  | {type: 'setEmail'; value: string}
  | {type: 'setPassword'; value: string}
  | {type: 'setDateOfBirth'; value: Date}
  | {type: 'setInviteCode'; value: string}
  | {type: 'setHandle'; value: string}
  | {type: 'setVerificationCode'; value: string}
  | {type: 'setError'; value: string}
  | {type: 'setCanNext'; value: boolean}
  | {type: 'setIsLoading'; value: boolean}

export const initialState: SignupState = {
  hasPrev: false,
  canNext: false,
  activeStep: SignupStep.INFO,

  serviceUrl: DEFAULT_SERVICE,
  serviceDescription: undefined,
  userDomain: '',
  dateOfBirth: DEFAULT_DATE,
  email: '',
  password: '',
  handle: '',
  inviteCode: '',

  error: '',
  isLoading: false,
}

export function is13(date: Date) {
  return getAge(date) >= 13
}

export function is18(date: Date) {
  return getAge(date) >= 18
}

export function reducer(s: SignupState, a: SignupAction): SignupState {
  let next = {...s}

  switch (a.type) {
    case 'prev': {
      if (s.activeStep !== SignupStep.INFO) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        next.activeStep--
        next.error = ''
      }
      break
    }
    case 'next': {
      if (s.activeStep !== SignupStep.CAPTCHA) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        next.activeStep++
        next.error = ''
      }
      break
    }
    case 'setStep': {
      next.activeStep = a.value
      break
    }
    case 'setServiceUrl': {
      next.serviceUrl = a.value
      break
    }
    case 'setServiceDescription': {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

      next.serviceDescription = a.value
      next.userDomain = a.value?.availableUserDomains[0] ?? ''
      next.isLoading = false
      break
    }

    case 'setEmail': {
      next.email = a.value
      break
    }
    case 'setPassword': {
      next.password = a.value
      break
    }
    case 'setDateOfBirth': {
      next.dateOfBirth = a.value
      break
    }
    case 'setInviteCode': {
      next.inviteCode = a.value
      break
    }
    case 'setHandle': {
      next.handle = a.value
      break
    }
    case 'setCanNext': {
      next.canNext = a.value
      break
    }
    case 'setIsLoading': {
      next.isLoading = a.value
      break
    }
    case 'setError': {
      next.error = a.value
      break
    }
  }

  next.hasPrev = next.activeStep !== SignupStep.INFO

  switch (next.activeStep) {
    case SignupStep.INFO: {
      const isValidEmail = EmailValidator.validate(next.email)
      next.canNext =
        !!(next.email && next.password && next.dateOfBirth) &&
        (!next.serviceDescription?.inviteCodeRequired || !!next.inviteCode) &&
        is13(next.dateOfBirth) &&
        isValidEmail
      break
    }
    case SignupStep.HANDLE: {
      next.canNext =
        !!next.handle && validateHandle(next.handle, next.userDomain).overall
      break
    }
  }

  logger.debug('signup', next)

  if (s.activeStep !== next.activeStep) {
    logger.debug('signup: step changed', {activeStep: next.activeStep})
  }

  return next
}

interface IContext {
  state: SignupState
  dispatch: React.Dispatch<SignupAction>
}
export const SignupContext = React.createContext<IContext>({} as IContext)
export const useSignupContext = () => React.useContext(SignupContext)

export function useSubmitSignup({
  state,
  dispatch,
}: {
  state: SignupState
  dispatch: (action: SignupAction) => void
}) {
  const {_} = useLingui()
  const {createAccount} = useSessionApi()
  const {mutateAsync: setBirthDate} = usePreferencesSetBirthDateMutation()
  const {mutate: setSavedFeeds} = useSetSaveFeedsMutation()
  const onboardingDispatch = useOnboardingDispatch()

  return useCallback(
    async (verificationCode?: string) => {
      if (!state.email) {
        dispatch({type: 'setStep', value: SignupStep.INFO})
        return dispatch({
          type: 'setError',
          value: _(msg`Please enter your email.`),
        })
      }
      if (!EmailValidator.validate(state.email)) {
        dispatch({type: 'setStep', value: SignupStep.INFO})
        return dispatch({
          type: 'setError',
          value: _(msg`Your email appears to be invalid.`),
        })
      }
      if (!state.password) {
        dispatch({type: 'setStep', value: SignupStep.INFO})
        return dispatch({
          type: 'setError',
          value: _(msg`Please choose your password.`),
        })
      }
      if (!state.handle) {
        dispatch({type: 'setStep', value: SignupStep.HANDLE})
        return dispatch({
          type: 'setError',
          value: _(msg`Please choose your handle.`),
        })
      }
      if (
        state.serviceDescription?.phoneVerificationRequired &&
        !verificationCode
      ) {
        dispatch({type: 'setStep', value: SignupStep.CAPTCHA})
        logger.error('Signup Flow Error', {
          errorMessage: 'Verification captcha code was not set.',
          registrationHandle: state.handle,
        })
        return dispatch({
          type: 'setError',
          value: _(msg`Please complete the verification captcha.`),
        })
      }
      dispatch({type: 'setError', value: ''})
      dispatch({type: 'setIsLoading', value: true})

      try {
        onboardingDispatch({type: 'start'}) // start now to avoid flashing the wrong view
        await createAccount({
          service: state.serviceUrl,
          email: state.email,
          handle: createFullHandle(state.handle, state.userDomain),
          password: state.password,
          inviteCode: state.inviteCode.trim(),
          verificationCode: verificationCode,
        })
        await setBirthDate({birthDate: state.dateOfBirth})
        if (IS_PROD_SERVICE(state.serviceUrl)) {
          setSavedFeeds(DEFAULT_PROD_FEEDS)
        }
      } catch (e: any) {
        onboardingDispatch({type: 'skip'}) // undo starting the onboard
        let errMsg = e.toString()
        if (e instanceof ComAtprotoServerCreateAccount.InvalidInviteCodeError) {
          dispatch({
            type: 'setError',
            value: _(
              msg`Invite code not accepted. Check that you input it correctly and try again.`,
            ),
          })
          dispatch({type: 'setStep', value: SignupStep.INFO})
          return
        }

        const error = cleanError(errMsg)
        const isHandleError = error.toLowerCase().includes('handle')

        dispatch({type: 'setIsLoading', value: false})
        dispatch({type: 'setError', value: error})
        dispatch({type: 'setStep', value: isHandleError ? 2 : 1})

        logger.error('Signup Flow Error', {
          errorMessage: error,
          registrationHandle: state.handle,
        })
      } finally {
        dispatch({type: 'setIsLoading', value: false})
      }
    },
    [
      state.email,
      state.password,
      state.handle,
      state.serviceDescription?.phoneVerificationRequired,
      state.serviceUrl,
      state.userDomain,
      state.inviteCode,
      state.dateOfBirth,
      dispatch,
      _,
      onboardingDispatch,
      createAccount,
      setBirthDate,
      setSavedFeeds,
    ],
  )
}

import {useReducer} from 'react'
import {
  ComAtprotoServerDescribeServer,
  ComAtprotoServerCreateAccount,
} from '@atproto/api'
import {I18nContext, useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import * as EmailValidator from 'email-validator'
import {getAge} from 'lib/strings/time'
import {logger} from '#/logger'
import {createFullHandle} from '#/lib/strings/handles'
import {cleanError} from '#/lib/strings/errors'
import {DispatchContext as OnboardingDispatchContext} from '#/state/shell/onboarding'
import {ApiContext as SessionApiContext} from '#/state/session'
import {DEFAULT_SERVICE} from '#/lib/constants'

export type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema
const DEFAULT_DATE = new Date(Date.now() - 60e3 * 60 * 24 * 365 * 20) // default to 20 years ago

export type CreateAccountAction =
  | {type: 'set-step'; value: number}
  | {type: 'set-error'; value: string | undefined}
  | {type: 'set-processing'; value: boolean}
  | {type: 'set-service-url'; value: string}
  | {type: 'set-service-description'; value: ServiceDescription | undefined}
  | {type: 'set-user-domain'; value: string}
  | {type: 'set-invite-code'; value: string}
  | {type: 'set-email'; value: string}
  | {type: 'set-password'; value: string}
  | {type: 'set-handle'; value: string}
  | {type: 'set-birth-date'; value: Date}
  | {type: 'next'}
  | {type: 'back'}

export interface CreateAccountState {
  // state
  step: number
  error: string | undefined
  isProcessing: boolean
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  userDomain: string
  inviteCode: string
  email: string
  password: string
  handle: string
  birthDate: Date

  // computed
  canBack: boolean
  canNext: boolean
  isInviteCodeRequired: boolean
}

export type CreateAccountDispatch = (action: CreateAccountAction) => void

export function useCreateAccount() {
  const {_} = useLingui()
  return useReducer(createReducer({_}), {
    step: 1,
    error: undefined,
    isProcessing: false,
    serviceUrl: DEFAULT_SERVICE,
    serviceDescription: undefined,
    userDomain: '',
    inviteCode: '',
    email: '',
    password: '',
    handle: '',
    birthDate: DEFAULT_DATE,

    canBack: false,
    canNext: false,
    isInviteCodeRequired: false,
  })
}

export async function submit({
  createAccount,
  onboardingDispatch,
  uiState,
  uiDispatch,
  _,
}: {
  createAccount: SessionApiContext['createAccount']
  onboardingDispatch: OnboardingDispatchContext
  uiState: CreateAccountState
  uiDispatch: CreateAccountDispatch
  _: I18nContext['_']
}) {
  if (!uiState.email) {
    uiDispatch({type: 'set-step', value: 2})
    return uiDispatch({
      type: 'set-error',
      value: _(msg`Please enter your email.`),
    })
  }
  if (!EmailValidator.validate(uiState.email)) {
    uiDispatch({type: 'set-step', value: 2})
    return uiDispatch({
      type: 'set-error',
      value: _(msg`Your email appears to be invalid.`),
    })
  }
  if (!uiState.password) {
    uiDispatch({type: 'set-step', value: 2})
    return uiDispatch({
      type: 'set-error',
      value: _(msg`Please choose your password.`),
    })
  }
  if (!uiState.handle) {
    uiDispatch({type: 'set-step', value: 3})
    return uiDispatch({
      type: 'set-error',
      value: _(msg`Please choose your handle.`),
    })
  }
  uiDispatch({type: 'set-error', value: ''})
  uiDispatch({type: 'set-processing', value: true})

  try {
    onboardingDispatch({type: 'start'}) // start now to avoid flashing the wrong view
    await createAccount({
      service: uiState.serviceUrl,
      email: uiState.email,
      handle: createFullHandle(uiState.handle, uiState.userDomain),
      password: uiState.password,
      inviteCode: uiState.inviteCode.trim(),
    })
  } catch (e: any) {
    onboardingDispatch({type: 'skip'}) // undo starting the onboard
    let errMsg = e.toString()
    if (e instanceof ComAtprotoServerCreateAccount.InvalidInviteCodeError) {
      errMsg = _(
        msg`Invite code not accepted. Check that you input it correctly and try again.`,
      )
    }
    logger.error('Failed to create account', {error: e})
    uiDispatch({type: 'set-processing', value: false})
    uiDispatch({type: 'set-error', value: cleanError(errMsg)})
    throw e
  }
}

export function is13(state: CreateAccountState) {
  return getAge(state.birthDate) >= 13
}

export function is18(state: CreateAccountState) {
  return getAge(state.birthDate) >= 18
}

function createReducer({_}: {_: I18nContext['_']}) {
  return function reducer(
    state: CreateAccountState,
    action: CreateAccountAction,
  ): CreateAccountState {
    switch (action.type) {
      case 'set-step': {
        return compute({...state, step: action.value})
      }
      case 'set-error': {
        return compute({...state, error: action.value})
      }
      case 'set-processing': {
        return compute({...state, isProcessing: action.value})
      }
      case 'set-service-url': {
        return compute({
          ...state,
          serviceUrl: action.value,
          serviceDescription:
            state.serviceUrl !== action.value
              ? undefined
              : state.serviceDescription,
        })
      }
      case 'set-service-description': {
        return compute({
          ...state,
          serviceDescription: action.value,
          userDomain: action.value?.availableUserDomains[0] || '',
        })
      }
      case 'set-user-domain': {
        return compute({...state, userDomain: action.value})
      }
      case 'set-invite-code': {
        return compute({...state, inviteCode: action.value})
      }
      case 'set-email': {
        return compute({...state, email: action.value})
      }
      case 'set-password': {
        return compute({...state, password: action.value})
      }
      case 'set-handle': {
        return compute({...state, handle: action.value})
      }
      case 'set-birth-date': {
        return compute({...state, birthDate: action.value})
      }
      case 'next': {
        if (state.step === 2) {
          if (!is13(state)) {
            return compute({
              ...state,
              error: _(
                msg`Unfortunately, you do not meet the requirements to create an account.`,
              ),
            })
          }
        }
        return compute({...state, error: '', step: state.step + 1})
      }
      case 'back': {
        return compute({...state, error: '', step: state.step - 1})
      }
    }
  }
}

function compute(state: CreateAccountState): CreateAccountState {
  let canNext = true
  if (state.step === 1) {
    canNext = !!state.serviceDescription
  } else if (state.step === 2) {
    canNext =
      (!state.isInviteCodeRequired || !!state.inviteCode) &&
      !!state.email &&
      !!state.password
  } else if (state.step === 3) {
    canNext = !!state.handle
  }
  return {
    ...state,
    canBack: state.step > 1,
    canNext,
    isInviteCodeRequired: !!state.serviceDescription?.inviteCodeRequired,
  }
}

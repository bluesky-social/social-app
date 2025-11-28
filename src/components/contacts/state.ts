import {useReducer} from 'react'

import type * as bsky from '#/types/bsky'

export type Contact = {
  /**
   * Generate ourselves - should be random or sequential
   */
  id: string
  firstName?: string
  lastName?: string
  phone?: string[]
}

// TODO: replace with lexicon type
export type Match = {
  index: number
  profile: bsky.profile.AnyProfileView
}

export type State =
  | {
      step: '1: phone input'
      phoneCode?: string
      phoneNumber?: string
    }
  | {
      step: '2: verify number'
      phoneCode: string
      phoneNumber: string
      lastSentAt: Date
      error?: string
    }
  | {
      step: '3: get contacts'
      contacts?: Contact[]
    }
  | {
      step: '4: view matches'
      contacts: Contact[]
      matches: Match[]
    }

export type Action =
  | {
      type: 'VERIFY_PHONE'
      payload: {
        phoneCode: string
        phoneNumber: string
      }
    }
  | {
      type: 'VERIFY_OTP_ERROR'
      payload: {
        error: string
      }
    }
  | {
      type: 'VERIFY_OTP_SUCCESS'
    }
  | {
      type: 'GET_CONTACTS_SUCCESS'
      payload: {
        contacts: Contact[]
      }
    }
  | {
      type: 'SYNC_CONTACTS_SUCCESS'
      payload: {
        matches: Match[]
      }
    }
  | {
      type: 'BACK'
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'VERIFY_PHONE': {
      assertCurrentStep(state, '1: phone input')
      return {
        step: '2: verify number',
        ...action.payload,
        lastSentAt: new Date(),
      }
    }
    case 'VERIFY_OTP_ERROR': {
      assertCurrentStep(state, '2: verify number')
      return {
        ...state,
        error: action.payload.error,
      }
    }
    case 'VERIFY_OTP_SUCCESS': {
      assertCurrentStep(state, '2: verify number')
      return {
        step: '3: get contacts',
      }
    }
    case 'BACK': {
      assertCurrentStep(state, '2: verify number')
      return {
        step: '1: phone input',
        phoneNumber: state.phoneNumber,
        phoneCode: state.phoneCode,
      }
    }
    case 'GET_CONTACTS_SUCCESS': {
      assertCurrentStep(state, '3: get contacts')
      return {
        ...state,
        contacts: action.payload.contacts,
      }
    }
    case 'SYNC_CONTACTS_SUCCESS': {
      assertCurrentStep(state, '3: get contacts')
      return {
        step: '4: view matches',
        contacts: state.contacts ?? [],
        matches: action.payload.matches,
      }
    }
  }
}

class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidStateTransitionError'
  }
}

function assertCurrentStep<S extends State['step']>(
  state: State,
  step: S,
): asserts state is Extract<State, {step: S}> {
  if (state.step !== step) {
    throw new InvalidStateTransitionError(
      `Invalid state transition: expecting ${step}, got ${state.step}`,
    )
  }
}

export function useSyncContactsFlowState(
  initialState: State = {step: '1: phone input'},
) {
  return useReducer(reducer, initialState)
}

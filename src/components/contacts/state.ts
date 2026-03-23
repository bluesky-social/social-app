import {createContext, useContext, useReducer} from 'react'
import {type GestureResponderEvent} from 'react-native'
import {type ExistingContact} from 'expo-contacts'

import {type CountryCode} from '#/lib/international-telephone-codes'
import type * as bsky from '#/types/bsky'

export type Contact = ExistingContact

export type Match = {
  profile: bsky.profile.AnyProfileView
  contact?: Contact
}

export type State =
  | {
      step: '1: phone input'
      phoneCountryCode?: CountryCode
      phoneNumber?: string
    }
  | {
      step: '2: verify number'
      phoneCountryCode: CountryCode
      phoneNumber: string
      lastSentAt: Date | null
    }
  | {
      step: '3: get contacts'
      phoneCountryCode: CountryCode
      phoneNumber: string
      token: string
      contacts?: Contact[]
    }
  | {
      step: '4: view matches'
      contacts: Contact[]
      matches: Match[]
      // rather than mutating `matches`, we keep track of dismissed matches
      // so we can roll back optimistic updates
      dismissedMatches: string[]
    }

export type Action =
  | {
      type: 'SUBMIT_PHONE_NUMBER'
      payload: {
        phoneCountryCode: CountryCode
        phoneNumber: string
      }
    }
  | {
      type: 'RESEND_VERIFICATION_CODE'
    }
  | {
      type: 'VERIFY_PHONE_NUMBER_SUCCESS'
      payload: {
        token: string
      }
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
        // filter out matched contacts
        contacts: Contact[]
      }
    }
  | {
      type: 'BACK'
    }
  | {
      type: 'DISMISS_MATCH'
      payload: {
        did: string
      }
    }
  | {
      type: 'DISMISS_MATCH_FAILED'
      payload: {
        did: string
      }
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SUBMIT_PHONE_NUMBER': {
      assertCurrentStep(state, '1: phone input')
      return {
        step: '2: verify number',
        ...action.payload,
        lastSentAt: null,
      }
    }
    case 'RESEND_VERIFICATION_CODE': {
      assertCurrentStep(state, '2: verify number')
      return {
        ...state,
        lastSentAt: new Date(),
      }
    }
    case 'VERIFY_PHONE_NUMBER_SUCCESS': {
      assertCurrentStep(state, '2: verify number')
      return {
        step: '3: get contacts',
        token: action.payload.token,
        phoneCountryCode: state.phoneCountryCode,
        phoneNumber: state.phoneNumber,
      }
    }
    case 'BACK': {
      assertCurrentStep(state, '2: verify number')
      return {
        step: '1: phone input',
        phoneNumber: state.phoneNumber,
        phoneCountryCode: state.phoneCountryCode,
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
        contacts: action.payload.contacts,
        matches: action.payload.matches,
        dismissedMatches: [],
      }
    }
    case 'DISMISS_MATCH': {
      assertCurrentStep(state, '4: view matches')
      return {
        ...state,
        dismissedMatches: [
          ...new Set(state.dismissedMatches),
          action.payload.did,
        ],
      }
    }
    case 'DISMISS_MATCH_FAILED': {
      assertCurrentStep(state, '4: view matches')
      return {
        ...state,
        dismissedMatches: state.dismissedMatches.filter(
          did => did !== action.payload.did,
        ),
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

export function useFindContactsFlowState(
  initialState: State = {step: '1: phone input'},
) {
  return useReducer(reducer, initialState)
}

export const FindContactsGoBackContext = createContext<
  (() => void) | undefined
>(undefined)
export function useOnPressBackButton() {
  const goBack = useContext(FindContactsGoBackContext)
  if (!goBack) {
    return undefined
  }
  return (evt: GestureResponderEvent) => {
    evt.preventDefault()
    goBack()
  }
}

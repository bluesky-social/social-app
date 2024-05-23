import React, {useEffect, useMemo, useReducer, useRef} from 'react'

import {useCurrentConvoId} from './current-convo-id'

const MessageDraftsContext = React.createContext<{
  state: State
  dispatch: React.Dispatch<Actions>
} | null>(null)

function useMessageDraftsContext() {
  const ctx = React.useContext(MessageDraftsContext)
  if (!ctx) {
    throw new Error(
      'useMessageDrafts must be used within a MessageDraftsContext',
    )
  }
  return ctx
}

export function useMessageDraft() {
  const {currentConvoId} = useCurrentConvoId()
  const {state, dispatch} = useMessageDraftsContext()
  return useMemo(
    () => ({
      getDraft: () => (currentConvoId && state[currentConvoId]) || '',
      clearDraft: () => {
        if (currentConvoId) {
          dispatch({type: 'clear', convoId: currentConvoId})
        }
      },
    }),
    [state, dispatch, currentConvoId],
  )
}

export function useSaveMessageDraft(message: string) {
  const {currentConvoId} = useCurrentConvoId()
  const {dispatch} = useMessageDraftsContext()
  const messageRef = useRef(message)
  messageRef.current = message

  useEffect(() => {
    return () => {
      if (currentConvoId) {
        dispatch({
          type: 'set',
          convoId: currentConvoId,
          draft: messageRef.current,
        })
      }
    }
  }, [currentConvoId, dispatch])
}

type State = {[convoId: string]: string}
type Actions =
  | {type: 'set'; convoId: string; draft: string}
  | {type: 'clear'; convoId: string}

function reducer(state: State, action: Actions): State {
  switch (action.type) {
    case 'set':
      return {...state, [action.convoId]: action.draft}
    case 'clear':
      return {...state, [action.convoId]: ''}
    default:
      return state
  }
}

export function MessageDraftsProvider({children}: {children: React.ReactNode}) {
  const [state, dispatch] = useReducer(reducer, {})

  const ctx = useMemo(() => {
    return {state, dispatch}
  }, [state])

  return (
    <MessageDraftsContext.Provider value={ctx}>
      {children}
    </MessageDraftsContext.Provider>
  )
}

import React from 'react'
import * as persisted from '#/state/persisted'
import {useSession} from './session'

type MutedWordsState = string[]
type ToggleWordContextType = (word: string) => void

const MutedWordsContext = React.createContext<MutedWordsState | undefined>(
  undefined,
)
const ToggleWordContext = React.createContext<ToggleWordContextType>(
  (_: string) => {},
)

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {currentAccount} = useSession()

  const initialMutedWordsState = currentAccount?.mutedWords || []

  const [state, setState] = React.useState<MutedWordsState>(
    initialMutedWordsState,
  )

  const loadMutedWordsForAccount = React.useCallback((account: {did: any}) => {
    const mutedWords = persisted.get(`mutedWords-${account.did}`) || []
    setState(mutedWords)
  }, [])

  React.useEffect(() => {
    if (currentAccount) {
      loadMutedWordsForAccount(currentAccount)
    }
  }, [currentAccount, loadMutedWordsForAccount])

  const toggleWordMute = React.useCallback(
    (word: string) => {
      const newState = [...state]
      const index = newState.indexOf(word)

      if (index !== -1) {
        newState.splice(index, 1)
      } else {
        newState.push(word)
      }

      setState(newState)
      if (currentAccount) {
        currentAccount.mutedWords = newState
        persisted.write(`mutedWords-${currentAccount.did}`, newState)
      }

      return newState.includes(word)
    },
    [state, currentAccount],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      if (currentAccount) {
        const updatedMutedWords =
          persisted.get(`mutedWords-${currentAccount.did}`) || []
        setState(updatedMutedWords)
      }
    })
  }, [currentAccount])

  return (
    <MutedWordsContext.Provider value={state}>
      <ToggleWordContext.Provider value={toggleWordMute}>
        {children}
      </ToggleWordContext.Provider>
    </MutedWordsContext.Provider>
  )
}

export function useMutedWords() {
  const context = React.useContext(MutedWordsContext)
  if (context === undefined) {
    throw new Error('useMutedWords must be used within a Provider')
  }
  return context
}

export function useToggleWordMute(): ToggleWordContextType {
  const context = React.useContext(ToggleWordContext)
  if (context === undefined) {
    throw new Error('useToggleWordMute must be used within a Provider')
  }
  return context
}

export function useIsWordMuted(word: string) {
  const {currentAccount} = useSession()

  const mutedWords = React.useMemo(() => {
    return currentAccount?.mutedWords || []
  }, [currentAccount])

  const isMuted = React.useMemo(() => {
    return mutedWords.includes(word)
  }, [word, mutedWords])

  return isMuted
}

export const containsMutedWordRecursive = (obj: any, mutedWords: string[]) => {
  if (!obj) return false

  const loweredMutedWords = mutedWords.map(word => word.toLowerCase())
  const stack = [obj]

  while (stack.length > 0) {
    const current = stack.pop()

    if (typeof current === 'string') {
      const lowerCaseText = current.toLowerCase()
      if (
        loweredMutedWords.some(mutedWord => lowerCaseText.includes(mutedWord))
      ) {
        return true
      }
    } else if (typeof current === 'object' && current !== null) {
      for (const key of Object.keys(current)) {
        const value = current[key]

        if (typeof value === 'string') {
          const lowerCaseText = value.toLowerCase()
          if (
            loweredMutedWords.some(mutedWord =>
              lowerCaseText.includes(mutedWord),
            )
          ) {
            return true
          }
        } else if (typeof value === 'object') {
          stack.push(value)
        }
      }
    }
  }

  return false
}

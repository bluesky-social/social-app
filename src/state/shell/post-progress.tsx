import React from 'react'

interface PostProgressState {
  progress: number
  status: 'pending' | 'success' | 'error' | 'idle'
  error?: string
}

const PostProgressContext = React.createContext<PostProgressState>({
  progress: 0,
  status: 'idle',
})
PostProgressContext.displayName = 'PostProgressContext'

export function Provider() {}

export function usePostProgress() {
  return React.useContext(PostProgressContext)
}

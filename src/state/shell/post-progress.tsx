import React from 'react'
import {number} from 'zod'

interface PostProgressState {
  progress: number
  status: 'pending' | 'success' | 'error' | 'idle'
  error?: string
}

const PostProgressContext = React.createContext<PostProgressState>({
  progress: number,
  status: 'idle',
})

export function Provider() {}

export function usePostProgress() {
  return React.useContext(PostProgressContext)
}

import {createContext} from 'react'

export const PickerContext = createContext<{
  isPicking: boolean
  isPressing: boolean
  hitting: string
}>({
  isPicking: false,
  isPressing: false,
  hitting: '',
})

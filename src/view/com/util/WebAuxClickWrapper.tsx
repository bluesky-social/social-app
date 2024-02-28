import React from 'react'
import {Platform} from 'react-native'

let shouldTrigger = false
const onMouseUp = (e: React.MouseEvent & {target: HTMLElement}) => {
  // Only handle whenever it is the middle button
  if (
    !shouldTrigger ||
    e.button !== 1 ||
    e.target.closest('a') ||
    e.target.tagName === 'A'
  ) {
    return
  }

  e.target.dispatchEvent(
    new MouseEvent('click', {metaKey: true, bubbles: true}),
  )
  shouldTrigger = false
}
const onMouseDown = (e: React.MouseEvent & {target: HTMLElement}) => {
  // Prevents the middle click scroll from enabling
  if (e.button !== 1 || e.target.closest('a') || e.target.tagName === 'A') {
    return
  }

  e.preventDefault()
  shouldTrigger = true
}

export function WebAuxClickWrapper({children}: React.PropsWithChildren<{}>) {
  if (Platform.OS !== 'web') return children

  return (
    // @ts-ignore web only
    <div onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
      {children}
    </div>
  )
}

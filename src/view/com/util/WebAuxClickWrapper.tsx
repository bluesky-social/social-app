import {MouseEvent, PropsWithChildren} from 'react'
import {Platform} from 'react-native'

const onMouseUp = (e: MouseEvent & {target: HTMLElement}) => {
  // Only handle whenever it is the middle button
  if (e.button !== 1 || e.target.closest('a') || e.target.tagName === 'A') {
    return
  }

  e.target.dispatchEvent(
    new MouseEvent('click', {metaKey: true, bubbles: true}),
  )
}

const onMouseDown = (e: MouseEvent) => {
  // Prevents the middle click scroll from enabling
  if (e.button !== 1) return
  e.preventDefault()
}

export function WebAuxClickWrapper({children}: PropsWithChildren<{}>) {
  if (Platform.OS !== 'web') return children

  return (
    // @ts-ignore web only
    <div onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
      {children}
    </div>
  )
}

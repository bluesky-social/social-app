/*
 * QuickReactButton (native stub). Native uses long-press gesture only, so
 * this component renders nothing on native.
 */

export type QuickReactButtonProps = {
  postUri: string
  surface: 'feed' | 'thread'
  visible: boolean
  onOpen: (anchor: {x: number; y: number}) => void
}

export function QuickReactButton(_props: QuickReactButtonProps): null {
  return null
}

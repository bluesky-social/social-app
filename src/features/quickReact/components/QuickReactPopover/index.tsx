/*
 * QuickReactPopover (native stub). Native uses QuickReactBar as the overlay,
 * so this component renders nothing.
 */

export type QuickReactPopoverProps = {
  postUri: string
  anchor: {x: number; y: number}
  surface: 'feed' | 'thread'
  entryPoint:
    | 'longPress'
    | 'hover'
    | 'click'
    | 'keyboard'
    | 'a11yAction'
    | 'chip'
  currentEmoji?: 'heart' | 'fire' | 'eyes' | 'joy'
  onSelect: (emoji: 'heart' | 'fire' | 'eyes' | 'joy') => void
  onRemove: () => void
  onDismiss: () => void
  logContext: 'FeedItem' | 'PostThreadItem'
}

export function QuickReactPopover(_props: QuickReactPopoverProps): null {
  return null
}

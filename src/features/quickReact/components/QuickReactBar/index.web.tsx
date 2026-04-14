/*
 * QuickReactBar (web stub). Web uses QuickReactPopover anchored to a React
 * button in the controls row, so this component renders nothing on web.
 */

export type QuickReactBarProps = {
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

export function QuickReactBar(_props: QuickReactBarProps): null {
  return null
}

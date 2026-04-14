/*
 * QuickReactBarTrigger (web).
 *
 * Wraps children + renders a QuickReactButton that becomes visible after
 * 200ms hover (AC-6). Touch-capable browsers (@media (hover: none)) see the
 * button always-visible. Clicking the button anchors and opens a
 * QuickReactPopover.
 *
 * Gated via useQuickReactsEnabled — OFF renders children only (AC-15).
 */

import {useRef, useState} from 'react'
import {View} from 'react-native'

import {QuickReactButton} from '#/features/quickReact/components/QuickReactButton'
import {QuickReactPopover} from '#/features/quickReact/components/QuickReactPopover'
import {HOVER_HIDE_MS, HOVER_REVEAL_MS} from '#/features/quickReact/constants'
import {useQuickReactController} from '#/features/quickReact/context'
import {useQuickReactsEnabled} from '#/features/quickReact/hooks/useQuickReactsEnabled'
import {useViewerReaction} from '#/features/quickReact/hooks/useViewerReaction'
import {
  type AnalyticsLogContext,
  type ReactionEmoji,
  type ReactionSurface,
} from '#/features/quickReact/types'

export type QuickReactBarTriggerProps = {
  postUri: string
  surface: ReactionSurface
  logContext: AnalyticsLogContext
  children: React.ReactNode
}

export function QuickReactBarTrigger({
  postUri,
  surface,
  logContext,
  children,
}: QuickReactBarTriggerProps) {
  const enabled = useQuickReactsEnabled()
  if (!enabled) {
    return <>{children}</>
  }
  return (
    <EnabledTrigger postUri={postUri} surface={surface} logContext={logContext}>
      {children}
    </EnabledTrigger>
  )
}

function EnabledTrigger({
  postUri,
  surface,
  logContext,
  children,
}: QuickReactBarTriggerProps) {
  const {emoji} = useViewerReaction({postUri})
  const controller = useQuickReactController()

  const [buttonVisible, setButtonVisible] = useState(false)
  const [popoverAnchor, setPopoverAnchor] = useState<{
    x: number
    y: number
  } | null>(null)
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    revealTimer.current = null
    hideTimer.current = null
  }

  const onHoverIn = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = null
    if (revealTimer.current) return
    revealTimer.current = setTimeout(() => {
      setButtonVisible(true)
      revealTimer.current = null
    }, HOVER_REVEAL_MS)
  }

  const onHoverOut = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current)
    revealTimer.current = null
    if (hideTimer.current) return
    hideTimer.current = setTimeout(() => {
      setButtonVisible(false)
      hideTimer.current = null
    }, HOVER_HIDE_MS)
  }

  const onOpen = (pt: {x: number; y: number}) => {
    clearTimers()
    setPopoverAnchor(pt)
  }

  const select = (e: ReactionEmoji) => {
    controller.schedule(postUri, e)
    setPopoverAnchor(null)
  }
  const remove = () => {
    controller.schedule(postUri, null)
    setPopoverAnchor(null)
  }

  return (
    <View onPointerEnter={onHoverIn} onPointerLeave={onHoverOut}>
      {children}
      <QuickReactButton
        postUri={postUri}
        surface={surface}
        visible={buttonVisible}
        onOpen={onOpen}
      />
      {popoverAnchor ? (
        <QuickReactPopover
          postUri={postUri}
          anchor={popoverAnchor}
          surface={surface}
          entryPoint="click"
          currentEmoji={emoji}
          onSelect={select}
          onRemove={remove}
          onDismiss={() => setPopoverAnchor(null)}
          logContext={logContext}
        />
      ) : null}
    </View>
  )
}

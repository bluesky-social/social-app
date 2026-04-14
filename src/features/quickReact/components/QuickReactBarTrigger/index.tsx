/*
 * QuickReactBarTrigger (native).
 *
 * Wraps post body children with a long-press gesture (>=400ms). On activation,
 * captures the touch point and renders the QuickReactBar overlay. Cancels if
 * the finger travels >8pt before 400ms (so feed scroll still works). Children
 * pass through for normal tap behavior.
 *
 * Gated via useQuickReactsEnabled — OFF renders children only (AC-15).
 */

import {useState} from 'react'
import {View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import {runOnJS} from 'react-native-reanimated'

import {QuickReactBar} from '#/features/quickReact/components/QuickReactBar'
import {LONG_PRESS_MS} from '#/features/quickReact/constants'
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
  const [anchor, setAnchor] = useState<{x: number; y: number} | null>(null)

  const openAt = (pt: {x: number; y: number}) => setAnchor(pt)
  const dismiss = () => setAnchor(null)

  const select = (e: ReactionEmoji) => {
    controller.schedule(postUri, e)
    setAnchor(null)
  }
  const remove = () => {
    controller.schedule(postUri, null)
    setAnchor(null)
  }

  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_MS)
    .maxDistance(8)
    .onStart(e => {
      'worklet'
      runOnJS(openAt)({x: e.absoluteX, y: e.absoluteY})
    })

  return (
    <>
      <GestureDetector gesture={longPress}>
        <View>{children}</View>
      </GestureDetector>
      {anchor ? (
        <QuickReactBar
          postUri={postUri}
          anchor={anchor}
          surface={surface}
          entryPoint="longPress"
          currentEmoji={emoji}
          onSelect={select}
          onRemove={remove}
          onDismiss={dismiss}
          logContext={logContext}
        />
      ) : null}
    </>
  )
}

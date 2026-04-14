/*
 * QuickReactA11yAction — returns an accessibilityActions + handler pair that
 * post row wrappers can spread onto their outer a11y-focusable element.
 *
 * When useQuickReactsEnabled() is false, returns an empty descriptor so the
 * a11y action list is unchanged (AC-15).
 */

import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useQuickReactsEnabled} from '#/features/quickReact/hooks/useQuickReactsEnabled'

export type QuickReactA11yActionHookArgs = {
  onReact: () => void
}

export type QuickReactA11yActionResult = {
  accessibilityActions?: Array<{name: string; label: string}>
  onAccessibilityAction?: (e: {nativeEvent: {actionName: string}}) => void
}

export const QUICK_REACT_ACTION_NAME = 'react'

export function useQuickReactA11yAction({
  onReact,
}: QuickReactA11yActionHookArgs): QuickReactA11yActionResult {
  const enabled = useQuickReactsEnabled()
  const {_} = useLingui()

  return useMemo<QuickReactA11yActionResult>(() => {
    if (!enabled) return {}
    return {
      accessibilityActions: [
        {name: QUICK_REACT_ACTION_NAME, label: _(msg`React to post`)},
      ],
      onAccessibilityAction: e => {
        if (e.nativeEvent.actionName === QUICK_REACT_ACTION_NAME) {
          onReact()
        }
      },
    }
  }, [enabled, _, onReact])
}

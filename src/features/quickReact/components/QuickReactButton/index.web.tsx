/*
 * QuickReactButton (web).
 *
 * Web React button rendered at the leading edge of PostControls. Visible
 * after 200ms hover (AC-6) or always when @media (hover: none) matches
 * (touch-capable browsers). Tab-focusable; Enter/Space opens the popover.
 * The popover lifecycle itself is owned by the parent — this button just
 * exposes an onOpen callback.
 */

import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {EmojiSmile_Stroke2_Corner0_Rounded as EmojiIcon} from '#/components/icons/Emoji'
import {useQuickReactsEnabled} from '#/features/quickReact/hooks/useQuickReactsEnabled'
import {type ReactionSurface} from '#/features/quickReact/types'

export type QuickReactButtonProps = {
  postUri: string
  surface: ReactionSurface
  visible: boolean
  onOpen: (anchor: {x: number; y: number}) => void
}

export function QuickReactButton({visible, onOpen}: QuickReactButtonProps) {
  const enabled = useQuickReactsEnabled()
  const {_} = useLingui()

  if (!enabled) return null

  const handlePress = (e: any) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.()
    const anchor = rect ? {x: rect.left, y: rect.bottom + 6} : {x: 0, y: 0}
    onOpen(anchor)
  }

  return (
    <Button
      label={_(msg`React to post`)}
      accessibilityHint={_(msg`Opens emoji reaction picker`)}
      size="tiny"
      color="secondary"
      shape="round"
      onPress={handlePress}
      style={[
        web({
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease-out',
          // Preserve focusability when invisible via hover: keep pointerEvents
          // on so keyboard users can Tab to it.
        }),
        !visible && web({':focus-within': {opacity: 1}}),
      ]}>
      <ButtonIcon icon={EmojiIcon} />
    </Button>
  )
}

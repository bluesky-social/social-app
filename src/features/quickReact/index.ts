/*
 * Quick-react public API. Consumers should import only from this barrel.
 */

export {
  QUICK_REACT_ACTION_NAME,
  useQuickReactA11yAction,
} from '#/features/quickReact/components/QuickReactA11yAction'
export {QuickReactBarTrigger} from '#/features/quickReact/components/QuickReactBarTrigger'
export {QuickReactButton} from '#/features/quickReact/components/QuickReactButton'
export {QuickReactChip} from '#/features/quickReact/components/QuickReactChip'
export {QuickReactPicker} from '#/features/quickReact/components/QuickReactPicker'
export {
  QuickReactProvider,
  useQuickReactController,
} from '#/features/quickReact/context'
export {useQuickReactsEnabled} from '#/features/quickReact/hooks/useQuickReactsEnabled'
export {useViewerReaction} from '#/features/quickReact/hooks/useViewerReaction'
export {
  type ReactionEmoji,
  type ReactionSurface,
} from '#/features/quickReact/types'

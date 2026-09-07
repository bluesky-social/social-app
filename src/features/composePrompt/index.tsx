import {useLingui} from '@lingui/react/macro'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {type ComposerLogContext} from '#/state/shell/composer'
import {type ComposePromptConfig, useComposePromptForScreen} from './context'

export {ComposePromptPill} from './ComposePromptPill'
export {
  type ComposePromptConfig,
  type ComposePromptOpenOptions,
  Provider,
  useComposePromptForScreen,
  useComposePromptState,
} from './context'

/**
 * Shows the compose pill in the bottom bar while this screen is present.
 * Render anywhere inside a `Layout.Screen`.
 */
export function ComposePrompt(config: ComposePromptConfig) {
  useComposePromptForScreen(config)
  return null
}

/**
 * The common case: a pill that opens the composer for a new post. Replaces
 * the old compose FAB, so it shares its analytics context by default.
 */
export function NewPostComposePrompt({
  mention,
  logContext = 'Fab',
}: {
  /**
   * Handle to pre-fill the post with, e.g. on someone else's profile.
   */
  mention?: string
  logContext?: ComposerLogContext
}) {
  const {t: l} = useLingui()
  const {openComposer} = useOpenComposer()

  useComposePromptForScreen({
    label: l`What's up?`,
    accessibilityLabel: l`Compose new post`,
    accessibilityHint: l`Opens the post composer`,
    open: options => openComposer({...options, mention, logContext}),
  })

  return null
}

import {type ImageLayout} from '#/view/com/composer/state/composer'
import {account} from '#/storage'

/**
 * Read the user's preferred layout for how 2 to 4 images are displayed in a
 * new post. Stored per-account and defaults to `carousel`. See the
 * `composerImageLayout` field on the `Account` schema for details.
 *
 * This is an imperative read (rather than a reactive hook) so callers can pull
 * the current value at event time - dispatch, reducer init, remove handler -
 * instead of relying on a render-captured value that can lag the store.
 */
export function getComposerImageLayout(did: string | undefined): ImageLayout {
  return account.get([did ?? 'pwi', 'composerImageLayout']) ?? 'carousel'
}

/**
 * Persist the user's preferred image layout for the given account.
 */
export function setComposerImageLayout(
  did: string | undefined,
  layout: ImageLayout,
): void {
  account.set([did ?? 'pwi', 'composerImageLayout'], layout)
}

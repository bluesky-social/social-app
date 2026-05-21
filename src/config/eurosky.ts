/**
 * Eurosky fork configuration - non-Lingui brand values.
 *
 * Single source of truth for brand identity that is NOT user-facing Lingui
 * copy (those are handled by src/config/euroskyStrings.ts). Editing values
 * here is the recommended way to rebrand; the goal is to keep the diff
 * against upstream small so merges stay easy.
 *
 * Constraints:
 * - Keep this module import-free (no #/state, #/lib, RN APIs) so it can be
 *   imported from anywhere - including low-level utils - without cycles.
 * - Native-build values (bundle id, app display name, scheme, Sentry/EAS)
 *   live in app.config.js, which runs in Node at Expo config time and
 *   cannot import this TS. That rebrand is a separate, later pass; this
 *   file currently only covers what the running app reads.
 */
export const EUROSKY = {
  brand: {
    /** Display name used in page/tab titles and in-app brand text. */
    name: 'Eurosky',
  },
} as const

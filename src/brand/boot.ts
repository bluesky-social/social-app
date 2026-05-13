/**
 * Side-effecting entry-point helper. Resolves the active brand and stashes
 * it. Importing this module sets the brand. Must be imported in the entry
 * file BEFORE any module that reads brand-driven constants.
 *
 * Platform splitting is handled by Metro: `resolve.ts` runs on native,
 * `resolve.web.ts` on web.
 */
import {setActiveBrand} from './activeBrand'
import {resolveBrand} from './resolve'

const brand = resolveBrand()

// Brand invariants. `defaultFeeds[0]` is the algorithmic discover pin and
// `[1]` is the following timeline; the wider app reads these by index in
// `src/lib/constants.ts`. Failing fast at boot is friendlier than the
// downstream `undefined` references that would otherwise appear.
if (!brand.defaultFeeds[0] || !brand.defaultFeeds[1]) {
  throw new Error(
    `Brand "${brand.id}" must declare at least 2 entries in defaultFeeds (discover, timeline)`,
  )
}

setActiveBrand(brand)

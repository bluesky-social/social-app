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

// On web, persist the resolved brand details so subsequent page loads can read them from localStorage early
if (typeof window !== 'undefined') {
  try {
    const {mark} = brand.logo
    const svgString =
      'xml' in mark
        ? mark.xml
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${mark.viewBox}"><path fill="currentColor" d="${mark.path}"/></svg>`
    localStorage.setItem('ACTIVE_BRAND_SPLASH_COLOR', brand.splashColor)
    localStorage.setItem(
      'ACTIVE_BRAND_SPLASH_COLOR_DARK',
      brand.splashColorDark,
    )
    localStorage.setItem('ACTIVE_BRAND_LOGO_SVG', svgString)
    localStorage.setItem('ACTIVE_BRAND_PRIMARY_COLOR', brand.primaryColor)
    localStorage.setItem(
      'ACTIVE_BRAND_BG_LIGHT',
      brand.palette.default.contrast_0,
    )
    localStorage.setItem(
      'ACTIVE_BRAND_BG_DARK',
      brand.palette.default.contrast_1000,
    )
    localStorage.setItem(
      'ACTIVE_BRAND_BG_DIM',
      brand.palette.subdued.contrast_1000,
    )

    // Dynamically apply tab title and favicon link
    if (typeof document !== 'undefined') {
      document.title = brand.name
      const existingFavicons = document.querySelectorAll("link[rel*='icon']")
      existingFavicons.forEach(el => el.remove())

      const faviconLink = document.createElement('link')
      faviconLink.type = 'image/svg+xml'
      faviconLink.rel = 'shortcut icon'
      faviconLink.href = `data:image/svg+xml,${encodeURIComponent(svgString)}`
      document.head.appendChild(faviconLink)
    }
  } catch (_) {}
}

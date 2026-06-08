/**
 * Eurosky logo - single source for the standalone star mark.
 *
 * Path + viewBox are the official `branding/eurosky_logos/icon/
 * eurosky-icon-black.svg` (the 12-point compass-rose star), verbatim. This
 * is the only brand glyph reused in more than one place (the <Logo>
 * component, the native Splash, web/index.html), so it lives here; the
 * wordmark is inlined in Logotype.tsx since that is its only consumer.
 *
 * Brand rule: the mark is monochrome - only ever black / white / cotton.
 * The `gradient` stops are the one carve-out for marketing/splash
 * treatments (matches the blue splash mock in the brand guide).
 */
export const EUROSKY_ICON = {
  viewBox: '0 0 1000 1000',
  /** width / height - the icon is square. */
  ratio: 1,
  path: 'M990.9671,522.1991c-3.0947,0-6.1689,0-9.2229.0001-456.4914.0202-459.525,3.0539-459.5452,459.5452-.0001,3.0539-.0001,6.1282-.0001,9.2228h-44.3979c0-3.0947,0-6.1689-.0001-9.2229-.0202-456.4913-3.0538-459.525-459.5452-459.5452-3.0539-.0001-6.1282-.0001-9.2229-.0001v-44.3981c3.0947,0,6.1689,0,9.2229-.0001,456.4914-.0202,459.525-3.0534,459.5452-459.5452.0001-3.0539.0001-6.1282.0001-9.2229h44.3979c0,3.0947,0,6.1689.0001,9.2228.0202,456.4917,3.0538,459.525,459.5452,459.5452,3.0539.0001,6.1282.0001,9.2229.0001v44.3981Z',
  /** Stops for the `fill="sky"` gradient variant (marketing/splash only). */
  gradient: {
    stop0: '#0087E2',
    stop1: '#9AC2FF',
  },
} as const

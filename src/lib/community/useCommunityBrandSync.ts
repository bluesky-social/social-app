import {useEffect} from 'react'

import {
  DEFAULT_BRAND_CONFIG,
  useSetBrandConfig,
} from '#/lib/community/BrandContext'
import {resolveBrandForAccount} from '#/lib/community/resolveBrand'
import {useSession} from '#/state/session'
import {useLoggedOutView} from '#/state/shell/logged-out'
import {IS_WEB} from '#/env'
import {account as accountStorage} from '#/storage'

/**
 * Keeps the active brand config in sync with the active account (native only).
 *
 * Web resolves brand by hostname at page load and never changes it mid-session,
 * so this is a no-op there. On native there is no hostname signal, so the brand
 * follows the account: on switch/resume we seed instantly from the per-account
 * cache (no theme flash) and then reconcile against the brand service.
 * `useBrand()` consumers (incl. ALF's ThemeProvider) re-render, so the whole app
 * re-themes without a remount.
 *
 * The logged-out surfaces (sign-in / create-account) always show the default
 * Blacksky brand — including when reached via "add another account" while still
 * signed in — so we reset to the default whenever the logged-out view is shown
 * or there is no account.
 *
 * Must run inside the session provider (`currentAccount`), the logged-out view
 * provider (`showLoggedOut`), and below the BrandProvider (the setter).
 */
export function useCommunityBrandSync(): void {
  const {currentAccount} = useSession()
  const {showLoggedOut} = useLoggedOutView()
  const setBrandConfig = useSetBrandConfig()

  const did = currentAccount?.did
  const pdsUrl = currentAccount?.pdsUrl
  const handle = currentAccount?.handle
  const communitySlug = currentAccount?.communitySlug

  useEffect(() => {
    // Web brand is fixed by hostname; this is native-only.
    if (IS_WEB) return

    // Logged-out surfaces (or no account) always show the default Blacksky brand.
    // Reset here rather than early-returning so a previous account's theme (or
    // the community being added) doesn't linger on the sign-in/create screens.
    if (!did || showLoggedOut) {
      setBrandConfig(DEFAULT_BRAND_CONFIG)
      return
    }

    let cancelled = false

    // 1. Instant seed from the per-account cache (synchronous MMKV).
    const cached = accountStorage.get([did, 'brandConfig'])
    if (cached) setBrandConfig(cached)

    // 2. Resolve fresh and reconcile. Null → unreachable/no match; keep the
    //    seeded (or default) config rather than clobbering it.
    void resolveBrandForAccount({pdsUrl, handle, communitySlug}).then(
      config => {
        if (cancelled || !config) return
        setBrandConfig(config)
        accountStorage.set([did, 'brandConfig'], config)
      },
    )

    return () => {
      cancelled = true
    }
  }, [did, pdsUrl, handle, communitySlug, showLoggedOut, setBrandConfig])
}

/**
 * Renders nothing; drives useCommunityBrandSync. Mounted inside the logged-out
 * view provider so the hook can read `showLoggedOut`.
 */
export function CommunityBrandSync(): null {
  useCommunityBrandSync()
  return null
}

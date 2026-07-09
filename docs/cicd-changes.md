# Blacksky CI/CD &amp; Observability Changes

Incremental plan for adapting the inherited Bluesky CI/CD pipeline and
improving observability. Each section is a self-contained change that can be
implemented and verified independently.

---

## 1. Switch from Bluesky's Custom OTA Server to Self-Hosted expo-open-ota

### Context

Bluesky runs a custom OTA update server at `updates.bsky.app` (internally
called "Denis"). The CI pipeline exported a JS bundle, tarballed it, and
uploaded it to that server via basic auth (`bsky:$DENIS_API_KEY`) using a
custom `scripts/bundleUpdate.sh`. That upload protocol is Bluesky-private and
is not implemented by any off-the-shelf server, so Blacksky could not reuse it.
OTA was disabled (`UPDATES_ENABLED = false` in `app.config.js`), meaning every
change - including JS-only changes - required a full native store build.

Rather than adopt Expo's hosted EAS Update (u.expo.dev), Blacksky now runs its
own update server: `expo-open-ota`, a self-hosted implementation of the Expo
Updates protocol v1, deployed at `https://updates.blacksky.community`. The
`expo-updates` client runtime is standard and speaks this protocol out of the
box; only the `updates.url` and code-signing config are repointed. Publishing
uses the `eoas` CLI, which runs `expo export` and uploads to expo-open-ota's
native endpoints, authenticating with the existing `EXPO_TOKEN` secret.

### What changed

#### `app.config.js` -- the `updates` block

OTA is enabled and the client points at the self-hosted manifest endpoint. The
channel is carried by the standard `expo-channel-name` request header, baked
into the build per environment (`production` vs `testflight`).

```js
updates: {
  url: 'https://updates.blacksky.community/manifest',
  enabled: true,
  fallbackToCacheTimeout: 30000,
  codeSigningCertificate: './code-signing/certificate.pem',
  codeSigningMetadata: {
    keyid: 'main',
    alg: 'rsa-v1_5-sha256',
  },
  checkAutomatically: 'NEVER',
  requestHeaders: {
    'expo-channel-name': IS_TESTFLIGHT ? 'testflight' : 'production',
  },
},
```

Details:
- `url` -- The self-hosted expo-open-ota manifest endpoint.
- `enabled` -- `true`. The `UPDATES_ENABLED` flag and its comment block were
  removed.
- `codeSigningCertificate` / `codeSigningMetadata` -- The committed
  `code-signing/certificate.pem` is the public cert; the client verifies each
  manifest signature against it. `keyid: 'main'`, `alg: 'rsa-v1_5-sha256'`. The
  server signs manifests with the matching private key (see Backend
  prerequisites below).
- `requestHeaders` -- Bakes the channel into the build. expo-open-ota resolves
  which branch to serve from the `expo-channel-name` header, so a testflight
  build always requests the `testflight` channel and a production build the
  `production` channel.
- `checkAutomatically: 'NEVER'` -- Kept. Update checking is driven manually by
  the `useOTAUpdates` hook (`src/lib/hooks/useOTAUpdates.ts`), which checks on
  app launch (after a delay) and when returning from background after 15+
  minutes.

#### `src/lib/hooks/useOTAUpdates.ts` -- header-driven channel (PR apply disabled)

The normal path no longer sets the channel as an extra param; it comes from the
baked-in `expo-channel-name` header. This is the production and testflight OTA
path and it is fully working: `useOTAUpdates` checks on launch and on
return-from-background, and expo-open-ota resolves the channel from that baked
header.

**PR-preview apply is currently DISABLED.** It is gated behind a
`PR_OTA_PREVIEWS_ENABLED = false` constant at the top of the file.
`useApplyPullRequestOTAUpdate.tryApplyUpdate` short-circuits and shows an
"Unavailable" alert instead of applying a PR channel; the runtime-override
machinery (`setUpdateURLAndRequestHeadersOverride`, `overrideChannel`,
`clearChannelOverride`) has been removed from the file.

Why it is off: retargeting an already-installed build to a `pull-request-<n>`
channel at runtime requires `setUpdateURLAndRequestHeadersOverride`, which in
turn requires `updates.disableAntiBrickingMeasures: true` in `app.config.js`
(otherwise it throws `ERR_UPDATES_RUNTIME_OVERRIDE` on iOS/Android). That flag
ships in production and weakens the embedded-update brick-recovery safety net
(Expo warns it "should not be used in production"), so it is intentionally left
off. The `disableAntiBrickingMeasures` flag is NOT set in `app.config.js`.

PR bundles are still published by CI (see `pull-request-comment.yml` below) -
they just cannot be applied on-device yet. To re-enable PR previews:

1. Set `updates.disableAntiBrickingMeasures: true` in `app.config.js`.
2. Set `PR_OTA_PREVIEWS_ENABLED = true` and restore the runtime override in
   `tryApplyUpdate` (`setUpdateURLAndRequestHeadersOverride` to point at the
   manifest URL with `{'expo-channel-name': channel}`, cleared with `null` on
   revert) in `src/lib/hooks/useOTAUpdates.ts`.
3. Rebuild the native binaries (the flag is a native build-time setting).

The deep link is still parsed by `src/lib/hooks/useIntentHandler.ts` and handed
to `useApplyPullRequestOTAUpdate`, but the apply path is a no-op alert while
disabled.

#### `bundle-deploy-eas-update.yml` -- publish via eoas on main

The old `expo export` + `bash scripts/bundleUpdate.sh` steps were replaced by a
single `eoas publish` step:

```yaml
- name: 🚀 Publish OTA Update (eoas)
  if: ${{ !steps.fingerprint.outputs.includes-changes }}
  run: >
    pnpm use-build-number pnpm exec eoas publish
    --branch=${{ inputs.channel || 'testflight' }}
    ...
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_RELEASE: ${{ steps.env.outputs.EXPO_PUBLIC_RELEASE_VERSION }}
    SENTRY_DIST: ${{ steps.env.outputs.EXPO_PUBLIC_BUNDLE_IDENTIFIER }}
```

`eoas publish` runs `expo export` internally, so the separate export step is
gone. Authentication uses the existing `EXPO_TOKEN` (already set up by the
`expo/expo-github-action` step earlier in the job); `DENIS_API_KEY` is no
longer referenced. `--branch=<channel>` selects the branch; Expo maps the
same-named channel to that branch.

#### `pull-request-comment.yml` -- publish PR previews via eoas

The same swap for PR OTAs, publishing to a per-PR branch:

```yaml
- name: 🚀 Publish PR OTA Update (eoas)
  run: >
    pnpm use-build-number pnpm exec eoas publish
    --branch=pull-request-${{ github.event.issue.number }}
    ...
  env:
    EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
    ...
```

The success comment posts the Blacksky deep link (the Bluesky QR service and
`bluesky://` scheme were removed):

```
`blacksky://intent/apply-ota?channel=pull-request-${{ github.event.issue.number }}`
```

`useIntentHandler.ts` already parses this scheme and hands the channel to the
PR-apply hook. Note: applying a PR bundle on-device is currently disabled (see
the `useOTAUpdates.ts` section above), so the comment notes that applying is
disabled - the bundle is published but not yet applyable.

#### `eoas` CLI

`eoas@^2.3.21` is a dev dependency. The `package.json` deploy script is
`"publish-ota": "eoas publish --nonInteractive"`; CI passes the branch and
other flags explicitly.

### Files deleted

- `scripts/bundleUpdate.sh` -- Denis-era upload script for `updates.bsky.app`.
- `scripts/bundleUpdate.js` -- Denis-era bundle tarball preparation.

### Secrets changes

- **Removed** `DENIS_API_KEY` -- no longer referenced.
- **No new secrets** -- `EXPO_TOKEN` (already configured for builds)
  authenticates `eoas publish`.

### Backend prerequisites

These are out of scope for the app repo but must be in place for OTA to
function end-to-end:

- **Expo channels/branches** -- The `production` and `testflight` channels (and
  dynamic `pull-request-<n>` channels) must exist and be mapped to same-named
  branches, so `eoas publish --branch=<channel>` serves builds requesting that
  channel via the `expo-channel-name` header.
- **Signing key** -- The expo-open-ota server's signing private key must be the
  pair of the committed public cert (`code-signing/certificate.pem`), or the
  client will reject manifest signatures.
- **Server env** -- `BASE_URL`, `EXPO_APP_ID`, and `EXPO_ACCESS_TOKEN` must be
  set on the server.
- **DNS** -- `updates.blacksky.community` must resolve to the server.

### Bug fix included

The runtime version validation in `bundle-deploy-eas-update.yml` had an
inverted condition (validated only when the variable was empty, a no-op). It
now validates when the variable is non-empty:

```bash
if [ -n "$RUNTIME_VERSION" ]; then
  [[ "$RUNTIME_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && echo "Version is valid" || exit 1
fi
```

### Verification

After implementing:

1. Push a JS-only change to `main` and confirm `bundleDeploy` runs
   `eoas publish` successfully.
2. Smoke-test the served manifest (see `docs/deploy-ota.md`).
3. On a testflight build, confirm the app picks up the update.
4. Comment `ota` on a PR and confirm the `pull-request-comment.yml` workflow
   publishes the PR bundle. (Applying it on-device via the
   `blacksky://intent/apply-ota` deep link is currently disabled - the deep
   link shows an "Unavailable" alert until PR previews are re-enabled.)
5. Push a native-code change and confirm the fingerprint check triggers a full
   build instead of an OTA update.

---

## 2. Add Logging to Silently Swallowed Errors

### Context

An audit of the codebase found 28 instances of `.catch(() => {})`,
`.catch(() => null)`, or empty `catch {}` blocks that discard errors without
any logging. Some of these are legitimate (animation failures, URL parsing,
localStorage in private browsing), but many suppress errors in places where
silent failure makes debugging difficult.

The fix is to add `logger.warn` calls to the catches that matter. This
surfaces errors via Sentry breadcrumbs (in production) and the `logDump` ring
buffer (for in-app bug reports) without changing any error handling behavior --
the catch blocks still swallow the errors, they just log them first.

### High priority -- errors that hide real bugs

#### `src/lib/media/manip.ts:179` -- Video download failure

```ts
// Before:
const result = await download.downloadAsync().catch(() => null)

// After:
const result = await download.downloadAsync().catch(e => {
  logger.warn('media:manip', {
    message: 'Video download failed',
    safeMessage: e,
  })
  return null
})
```

**Why this matters:** `saveVideoToMediaLibrary` returns `false` on failure, but
the caller has no way to know *why* -- network error, disk full, invalid URL,
permissions issue. The user sees a generic failure with no diagnostic trail.

#### `src/components/dialogs/EmailDialog/screens/Update.tsx:184-187` -- Email verification silenced

```ts
// Before:
try {
  // fire off a confirmation email immediately
  await requestEmailVerification()
} catch {}

// After:
try {
  await requestEmailVerification()
} catch (e) {
  logger.warn('EmailDialog', {
    message: 'Failed to send verification email after update',
    safeMessage: e,
  })
}
```

**Why this matters:** The email update itself succeeds (line 181 sets status to
`'success'`), but if the verification email fails to send, the user has an
unverified email address with no indication that anything went wrong. The outer
catch (line 189) only catches failures from the email *update* mutation, not
this follow-up verification call.

#### `src/screens/Bookmarks/index.tsx:123-125` -- Bookmark pagination failure

```ts
// Before:
try {
  await fetchNextPage()
} catch {}

// After:
try {
  await fetchNextPage()
} catch (e) {
  logger.warn('Bookmarks', {
    message: 'Failed to fetch next page',
    safeMessage: e,
  })
}
```

**Why this matters:** If pagination fails silently during infinite scroll, the
list just stops loading more items with no error indication. The user may think
they have reached the end of their bookmarks. TanStack Query's `error` state
(checked on line 122) would only be set by the *initial* fetch, not by
`fetchNextPage` errors caught here.

#### `src/view/screens/SupportReturn.tsx:41-48` -- Stripe session status check

```ts
// Before:
fetch(`${STRIPE_API_URL}/session-status?session_id=${sessionId}`)
  .then(res => res.json())
  .then(data => {
    setStatus(data.status)
  })
  .catch(() => {
    setStatus('error')
  })

// After:
fetch(`${STRIPE_API_URL}/session-status?session_id=${sessionId}`)
  .then(res => res.json())
  .then(data => {
    setStatus(data.status)
  })
  .catch(e => {
    logger.warn('SupportReturn', {
      message: 'Failed to check Stripe session status',
      safeMessage: e,
    })
    setStatus('error')
  })
```

**Why this matters:** The UI correctly shows an error state, but without
logging you cannot distinguish between network failures, invalid session IDs,
Stripe API errors, or JSON parse failures. This is a payment flow.

### Medium priority -- errors that complicate debugging

#### `src/state/session/moderation.ts:31` -- Labeler config read failure

```ts
// Before:
const labelerDids = await readLabelers(account.did).catch(_ => {})

// After:
const labelerDids = await readLabelers(account.did).catch(e => {
  logger.warn('moderation', {
    message: 'Failed to read labeler config',
    safeMessage: e,
  })
})
```

**Why this matters:** If labeler config cannot be read, the app falls through
to the `else` branch (line 38) and does not send labeler headers on initial
requests. This silently degrades moderation behavior. The user sees unmoderated
content with no indication of why.

#### `src/state/queries/threadgate/index.ts:278` -- Threadgate sync retry exhaustion

```ts
// Before:
).catch(() => {})

// After:
).catch(e => {
  logger.warn('threadgate', {
    message: 'Threadgate sync retries exhausted',
    safeMessage: e,
  })
})
```

**Why this matters:** This is at the end of a retry loop that polls the
appview until threadgate settings propagate. If all retries fail, the UI
falls through without updating (`data` is undefined, so
`updatePostThreadThreadgate` on line 280 is skipped). The user's threadgate
change may have been applied server-side but the UI never reflects it.

#### `src/state/queries/profile.ts:88` and `:202` -- Bluesky proxy profile fetch

```ts
// Before:
const bskyPromise = agent.app.bsky.actor
  .getProfile({actor: did ?? ''}, {headers: BSKY_PROXY_HEADER})
  .catch(() => null)

// After:
const bskyPromise = agent.app.bsky.actor
  .getProfile({actor: did ?? ''}, {headers: BSKY_PROXY_HEADER})
  .catch(e => {
    logger.warn('profile', {
      message: 'Bluesky proxy profile fetch failed',
      safeMessage: e,
    })
    return null
  })
```

**Why this matters:** This is a parallel fetch to Bluesky's appview to get
"official" follower/following counts and known followers. If it fails, the
profile still loads but with potentially stale or inconsistent counts. Logging
helps track whether this proxy is reliably reachable from Blacksky's
infrastructure. Apply this change at both line 88 and line 202.

#### `src/analytics/features/index.ts:48` -- GrowthBook init failure

```ts
// Before:
export const init = features
  .init({timeout: TIMEOUT_INIT, streaming: true})
  .catch(() => {
    // Swallow errors from GrowthBook init (e.g. CORS failures, cache
    // corruption). The app should still load without feature gates.
  })

// After:
export const init = features
  .init({timeout: TIMEOUT_INIT, streaming: true})
  .catch(e => {
    logger.warn('Growthbook', {
      message: 'Feature flag init failed, running without gates',
      safeMessage: e,
    })
  })
```

**Why this matters:** The app loads fine without feature gates, but persistent
init failures mean all feature flags and experiments are silently disabled. If
Blacksky sets up its own GrowthBook instance and misconfigures it, this would
fail silently with no indication in error tracking.

#### `src/screens/Search/modules/ExploreInterestsCard.tsx:37` -- NUX state persistence

```ts
// Before:
saveNux({
  id: Nux.ExploreInterestsCard,
  completed: true,
  data: undefined,
}).catch(() => {})

// After:
saveNux({
  id: Nux.ExploreInterestsCard,
  completed: true,
  data: undefined,
}).catch(e => {
  logger.warn('ExploreInterestsCard', {
    message: 'Failed to persist NUX dismissal',
    safeMessage: e,
  })
})
```

**Why this matters:** If NUX persistence fails, the card reappears on next
app launch. Not critical, but repeated persistence failures indicate a
storage issue that affects other NUX flows too.

#### `src/screens/Profile/components/GermButton.tsx:133` -- Germ declaration retrieval

```ts
// Before:
const previousRecord = await agent.com.germnetwork.declaration
  .get({ repo: did, rkey: 'self' })
  .then(res => res.value)
  .catch(() => null)

// After:
const previousRecord = await agent.com.germnetwork.declaration
  .get({ repo: did, rkey: 'self' })
  .then(res => res.value)
  .catch(e => {
    logger.warn('GermButton', {
      message: 'Failed to read previous declaration for undo',
      safeMessage: e,
    })
    return null
  })
```

**Why this matters:** The delete operation still proceeds (line 135), but if
the previous record couldn't be read, the undo callback (line 147) silently
becomes a no-op (`if (!previousRecord) return`). The user can delete their
Germ declaration but cannot undo it, with no indication of why.

#### `src/components/ContextMenu/index.tsx:295` -- View measurement for menu positioning

```ts
// Before:
measureView(ref.current, insets)
  .then(newMeasurement => {
    if (...) {
      context.returnLocationSV.set({
        x: newMeasurement.x,
        y: newMeasurement.y,
      })
    }
  })
  .catch(() => {})

// After:
measureView(ref.current, insets)
  .then(newMeasurement => {
    if (...) {
      context.returnLocationSV.set({
        x: newMeasurement.x,
        y: newMeasurement.y,
      })
    }
  })
  .catch(e => {
    logger.warn('ContextMenu', {
      message: 'View measurement failed on keyboard hide',
      safeMessage: e,
    })
  })
```

**Why this matters:** This runs on keyboard hide to update the context menu's
return position. If measurement fails, the menu may animate back to a stale
or incorrect position. Low severity, but helpful for debugging layout issues
on specific devices.

### Intentionally left silent

These catches were reviewed and do not need logging:

| File | Line | Reason |
|------|------|--------|
| `src/Splash.tsx` | 201 | Animation sequence completion. Failure is harmless; the app renders regardless. |
| `src/lib/hooks/useIntentHandler.ts` | 40 | `WebBrowser.dismissBrowser()` on iOS. Best-effort cleanup; failure means the browser was already dismissed. |
| `src/components/Post/Embed/VideoEmbed/.../VideoEmbedInnerWeb.tsx` | 371 | `video.play()` rejection. Standard browser autoplay policy behavior; logging would be extremely noisy. |
| `src/lib/strings/url-helpers.ts` | 160, 172, 184, 197, 209, 224 | URL parsing with `new URL()`. Invalid URLs are expected in user-generated content; these return `false`/`undefined` by design. |
| `src/state/persisted/index.web.ts` | 141, 153 | `localStorage` access. Documented: private browsing mode throws on access. Expected behavior. |
| `src/state/shell/selected-feed.tsx` | 55 | `sessionStorage.setItem`. Same private browsing limitation as localStorage. |
| `src/state/session/oauth-client.ts` | 28 | `response.text()` for debug logging. This is already inside a logging path; if text extraction fails, the log just has less detail. |
| `src/state/session/oauth-client.web.ts` | 102 | Same pattern as above for web OAuth. |
| `src/screens/Deactivated.tsx` | 54-55 | Logout during account deactivation. Comment documents it: "best-effort cleanup; the throwaway session expires anyway." |
| `src/screens/StarterPack/StarterPackScreen.tsx` | 224 | `Image.prefetch` for OG card. Catch sets `imageLoaded = true` same as success. UI works either way. |
| `src/state/feed-feedback.tsx` | 164 | Feed interaction stats. Comment documents it: "ignore upstream errors." Non-critical analytics. |
| `src/view/screens/Notifications.tsx` | 209 | `checkUnread` failure. Loading state still clears via `.then()`. Notification check retries on next interval. |
| `src/state/session/moderation.ts` | 56 | `resolveHandle('mod-authority.test')`. Test-user-only path; handle may not exist outside test environments. |
| `src/components/EmojiPicker/preload.web.ts` | 26 | Optional emoji data preload. If it fails, the picker loads data on first open instead. |
| `src/state/queries/microcosm-fallback.ts` | 261 | `res.json()` for error body parsing. Defensive; null fallback is checked on next line. |

### Verification

After implementing, confirm:

1. Run `pnpm test` -- no test failures from the added logging.
2. In development, trigger a few of these paths (e.g., open bookmarks, view a
   profile) and confirm `logger.warn` calls appear in the console transport
   only when actual errors occur, not on every invocation.
3. The changes should not alter any user-facing behavior -- catches still
   swallow errors, they just log them first.

---

## 3. Update Hardcoded `bsky.app` References in Source Code

### Context

`app.config.js` has been fully updated to Blacksky domains, schemes, and
identifiers. But the source code itself still contains hardcoded `bsky.app`
references that affect deep linking, analytics, moderation UI, and service
endpoints.

### What changes

#### `src/Navigation.tsx:800-809` -- Deep link prefixes

The `LINKING` config determines which URL prefixes the app recognizes as
internal navigation links. It currently includes both Bluesky and Blacksky
prefixes. There's already a TODO comment on line 801.

```ts
// Before:
const LINKING = {
  // TODO figure out what we are going to use
  // note: `blacksky://` is what is used in app.config.js
  prefixes: [
    'bsky://',
    'blacksky://',
    'https://bsky.app',
    'https://blacksky.community',
    'https://staging.blacksky.community',
  ],
  // ...

// After:
const LINKING = {
  prefixes: [
    'blacksky://',
    'community.blacksky://',
    'https://blacksky.community',
    'https://staging.blacksky.community',
  ],
  // ...
```

The `blacksky://` and `community.blacksky://` schemes match `app.config.js`
line 55 (`scheme: ['blacksky', 'community.blacksky']`). Remove `bsky://` and
`https://bsky.app` unless there is a specific reason to handle Bluesky links
inside the Blacksky app.

**Decision needed:** Should Blacksky handle `bsky.app` links (e.g., if someone
pastes a Bluesky profile URL into the Blacksky app)? If yes, keep
`https://bsky.app` in the prefixes array. If no, remove it. The AT Protocol
paths are the same (`/profile/did:plc:...`), so handling them is technically
possible but may confuse users.

#### `src/Navigation.tsx:1028` -- Referrer hostname check

```ts
// Before:
if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {

// After:
if (referrerInfo && referrerInfo.hostname !== 'blacksky.community') {
```

This filters out self-referrals from deep link analytics. Without this change,
navigations from `blacksky.community` itself would be logged as external
referrals.

#### `src/screens/Moderation/index.tsx:378-387` -- Hardcoded Bluesky link in moderation UI

This is a visible, user-facing link that says "bsky.app" and opens
`https://bsky.app/` in the browser. It appears in the moderation settings
screen.

```tsx
// Before:
<InlineLinkText
  label={_(msg`The Bluesky web application`)}
  to=""
  onPress={evt => {
    evt.preventDefault()
    Linking.openURL('https://bsky.app/')
    return false
  }}>
  bsky.app
</InlineLinkText>

// After:
<InlineLinkText
  label={_(msg`The Blacksky web application`)}
  to=""
  onPress={evt => {
    evt.preventDefault()
    Linking.openURL('https://blacksky.community/')
    return false
  }}>
  blacksky.community
</InlineLinkText>
```

#### `src/env/common.ts` -- Service endpoint defaults

These are the runtime service URLs the app uses. The primary proxy DID
(line 79) already defaults to `did:web:api.blacksky.community`.

```ts
// Line 80 -- ALT_PROXY_DID
// Decision: keep as `did:web:api.bsky.app` for federation fallback,
// or remove if Blacksky should not fall back to Bluesky's API.

// Line 92 -- METRICS_API_HOST
// Change from 'https://events.bsky.app' to Blacksky endpoint or ''
// (covered separately in observability changes)

// Line 131 -- GEOLOCATION_PROD_URL
export const GEOLOCATION_PROD_URL = `https://ip.bsky.app`
// Decision: stand up Blacksky equivalent or remove geolocation feature

// Line 141 -- LIVE_EVENTS_PROD_URL
export const LIVE_EVENTS_PROD_URL = `https://live-events.workers.bsky.app`
// Decision: stand up Blacksky equivalent or disable live events

// Line 163 -- APP_CONFIG_PROD_URL
export const APP_CONFIG_PROD_URL = `https://app-config.workers.bsky.app`
// Decision: stand up Blacksky equivalent or disable remote app config
```

Each of these is a separate service that Bluesky operates. For each one,
Blacksky needs to decide whether to:
- Stand up an equivalent service
- Remove the feature that depends on it
- Leave the Bluesky endpoint as a federation dependency (appropriate for
  `ALT_PROXY_DID` since Bluesky's API is part of the AT Protocol network,
  but not appropriate for telemetry or app config)

### What does not change

- `@bsky.app/*` imports throughout the codebase (e.g., `@bsky.app/alf`,
  `@bsky.app/react-native-mmkv`, `@bsky.app/expo-image-crop-tool`) -- these
  are npm package names, not URLs. They reference published packages and do
  not need changing.

### Verification

1. After updating `LINKING` prefixes, test that `blacksky://` deep links
   resolve correctly in the app.
2. After updating the moderation screen, visually confirm the link text and
   destination are correct.
3. After updating the referrer check, confirm that navigations from
   `blacksky.community` web are not logged as external referrals.

---

## 4. Support Page: App Store Compliance for Stripe Checkout

### Context

The Support screen (`src/view/screens/Support.tsx`) is accessible from the
navigation drawer (`src/view/shell/Drawer.tsx:299`). It renders:

1. An OpenCollective link (external, always shown)
2. A Stripe embedded checkout form (web only -- returns `null` on native via
   `SupportStripeCheckout.tsx`)

The native file (`src/view/screens/SupportStripeCheckout.tsx`) already returns
`null`, so the Stripe checkout UI does not render on iOS or Android. Only the
OpenCollective link appears on native.

However, the screen still needs review for App Store compliance:

### App Store rules to consider

**Apple App Store Review Guideline 3.1.1 (In-App Purchase):** Apps may not
include buttons, links, or other calls to action that direct users to external
purchasing mechanisms. This applies to donations/tips if they are facilitated
within the app.

**What this means for the Support screen on iOS:**
- The OpenCollective link on line 57 (`https://opencollective.com/blacksky`)
  directs users to an external payment mechanism. Apple may reject this.
- The Stripe checkout returning `null` on native is fine -- it already does
  not render.

### Options

#### Option A: Remove the Support screen from native navigation entirely

```ts
// src/view/shell/Drawer.tsx - remove or guard the navigation:
// Before (line 299):
navigation.navigate('Support')

// After:
if (IS_WEB) {
  navigation.navigate('Support')
} else {
  Linking.openURL('https://blacksky.community/support')
}
```

This opens the browser for the full support page instead of rendering it
in-app. Apple's guidelines are less strict about links to your website where
payment happens to be available, vs explicit in-app "donate" buttons that go
to external payment.

#### Option B: Conditionally hide the OpenCollective link on iOS

```tsx
// src/view/screens/Support.tsx
// Wrap the OpenCollective card in a platform check:
{IS_WEB && (
  <View style={[...]}>
    <Text>OpenCollective</Text>
    ...
  </View>
)}
```

This makes the Support screen show nothing useful on native (since Stripe
also returns `null`). In that case, the screen entry point should be hidden
or redirected as in Option A.

#### Option C: Keep the screen but reword it

If the screen is kept on native, avoid words like "donate", "support",
"contribute" that imply payment, and instead link to general information.
This is the weakest compliance approach.

### Recommendation

Option A is the safest. Open the support page in the external browser on
native. The in-app Support screen continues to work as-is on web, where
Apple's guidelines do not apply.

### Files involved

| File | What to change |
|------|----------------|
| `src/view/shell/Drawer.tsx:299` | Guard native navigation to open browser instead |
| `src/view/screens/Support.tsx` | No change needed if drawer is guarded |
| `src/view/screens/SupportStripeCheckout.tsx` | No change (already returns null on native) |
| `src/view/screens/SupportReturn.tsx` | Web-only; no change needed |
| `src/Navigation.tsx:337-344` | Optionally remove Support route from native stack |

### Verification

1. On iOS simulator/device, tap Support in the drawer and confirm it opens
   the browser to `https://blacksky.community/support` (or equivalent).
2. On web, confirm the Support screen still renders with both OpenCollective
   and Stripe checkout.
3. Review against Apple's current App Store Review Guidelines section 3.1
   before submission.

---

## 5. CI Workflow Updates: Repository Guards, Artifact Paths, and Cleanup

### Context

The CI workflows inherited from Bluesky have hardcoded repository guards that
prevent jobs from running unless the repo is `bluesky-social/social-app`.
Several workflows also reference `Bluesky.ipa` artifact paths, the old bundle
ID `xyz.blueskyweb.app`, and the old Sentry org `blueskyweb`. One workflow
(`sync-internal.yaml`) force-pushes to a Bluesky-internal repo and should be
deleted entirely. Five upstream container workflows should also be deleted.

### Repository guard changes

Replace `github.repository == 'bluesky-social/social-app'` with
`github.repository == 'blacksky-algorithms/blacksky.community'` in:

| File | Lines | Jobs affected |
|------|-------|--------------|
| `build-submit-ios.yml` | 41 | Entire build job |
| `build-submit-android.yml` | 33, 205 | Build job + production tag guard |
| `bundle-deploy-eas-update.yml` | 27, 167, 321 | bundleDeploy + buildIfNecessaryIOS + buildIfNecessaryAndroid |
| `nightly-build.yml` | 19 | prepare job (blocks all downstream) |

Note: `pull-request-commit.yml` does not have a hardcoded guard (uses
dynamic same-repo check). `lint.yml` has no guard. These are fine as-is.

### Artifact path and identity changes

#### `build-submit-ios.yml`

```yaml
# Line 178 -- IPA submit path
# Before:
run: pnpm eas submit -p ios --non-interactive --path "$BUILD_DIR/Bluesky.ipa"
# After:
run: pnpm eas submit -p ios --non-interactive --path "$BUILD_DIR/Blacksky.ipa"

# Line 185 -- dSYM upload path
# Before:
pnpm sentry-cli debug-files upload "$BUILD_DIR/Bluesky.app.dSYM.zip" --include-sources
# After:
pnpm sentry-cli debug-files upload "$BUILD_DIR/Blacksky.app.dSYM.zip" --include-sources

# Line 200 -- Info.plist extraction
# Before:
unzip -o -q "$BUILD_DIR/Bluesky.ipa" 'Payload/*.app/Info.plist' -d "$plist_dir"
# After:
unzip -o -q "$BUILD_DIR/Blacksky.ipa" 'Payload/*.app/Info.plist' -d "$plist_dir"

# Line 241 -- Fastlane app identifier
# Before:
app_identifier:"xyz.blueskyweb.app" \
# After:
app_identifier:"community.blacksky.app" \
```

**Important:** The artifact names (`Bluesky.ipa`, `Bluesky.app.dSYM.zip`)
are determined by the Xcode product name, which is derived from the app name
in `app.config.js`. Since `app.config.js` already sets `name: 'Blacksky'`,
the first native build should produce `Blacksky.ipa` and
`Blacksky.app.dSYM.zip`. Verify this after the first build -- if the names
differ, update accordingly.

#### `bundle-deploy-eas-update.yml`

```yaml
# Line 287 -- IPA submit path (buildIfNecessaryIOS job)
# Before:
run: pnpm eas submit -p ios --non-interactive --path "$BUILD_DIR/Bluesky.ipa"
# After:
run: pnpm eas submit -p ios --non-interactive --path "$BUILD_DIR/Blacksky.ipa"

# Line 291-292 -- Sentry org and project
# Before:
SENTRY_ORG=blueskyweb
SENTRY_PROJECT=app
# After:
SENTRY_ORG=blacksky-algorithms
SENTRY_PROJECT=social-app

# Line 294 -- dSYM upload path
# Before:
pnpm sentry-cli debug-files upload "$BUILD_DIR/Bluesky.app.dSYM.zip" --include-sources
# After:
pnpm sentry-cli debug-files upload "$BUILD_DIR/Blacksky.app.dSYM.zip" --include-sources
```

### Slack webhook removal

Remove the `SLACK_CLIENT_ALERT_WEBHOOK` secret references and Slack
notification steps from all workflows. Files affected:

- `build-submit-ios.yml` -- Slack notify step after production build
- `build-submit-android.yml` -- Slack notify step after build
- `bundle-deploy-eas-update.yml` -- Slack notify in buildIfNecessaryAndroid
- `nightly-build.yml` -- Slack notify after nightly builds

### Files to delete

#### `sync-internal.yaml`

Force-pushes to `bluesky-social/social-app-internal` on every push to main.
Blacksky has no access to this repo. Delete the file.

#### Upstream container workflows

These build and push Docker images to AWS ECR and GitHub Container Registry
for Bluesky's infrastructure. Blacksky has its own DOCR workflow
(`build-and-push-bskyweb-docr.yaml`) which is already correctly guarded.
Delete:

- `.github/workflows/build-and-push-bskyweb-aws.yaml`
- `.github/workflows/build-and-push-bskyweb-ghcr.yaml`
- `.github/workflows/build-and-push-link-aws.yaml`
- `.github/workflows/build-and-push-ogcard-aws.yaml`
- `.github/workflows/build-and-push-embedr-aws.yaml`

### Secrets to provision

These GitHub Actions secrets must be created for the workflows to run:

| Secret | Purpose |
|--------|---------|
| `EXPO_TOKEN` | EAS CLI authentication (builds, submit, version management) |
| `ENV_TOKEN` | Contents written to `.env` during builds |
| `GOOGLE_SERVICES_TOKEN` | Android `google-services.json` contents for FCM |
| `SENTRY_DSN` | Sentry client-side error reporting endpoint |
| `SENTRY_AUTH_TOKEN` | Sentry CLI for sourcemap + dSYM uploads |

Not needed:
- `SLACK_CLIENT_ALERT_WEBHOOK` -- removed
- `DENIS_API_KEY` -- removed (replaced by EAS Update)
- `BITDRIFT_API_KEY` -- dead code, can be left unset
- `SYNC_INTERNAL_*` -- removed with workflow deletion
- AWS ECR secrets -- removed with workflow deletion

### Service URL defaults in `src/env/common.ts`

These hardcoded Bluesky service URLs need to be addressed:

```ts
// Line 92 -- Metrics API (covered in analytics-options.md)
// Set METRICS_API_HOST to '' and guard MetricsClient.start()

// Line 131 -- Geolocation
export const GEOLOCATION_PROD_URL = `https://ip.bsky.app`
// Decision: stand up equivalent or disable. Used for age assurance
// region detection and GrowthBook targeting attributes.

// Line 141 -- Live Events
export const LIVE_EVENTS_PROD_URL = `https://live-events.workers.bsky.app`
// Decision: stand up equivalent or disable live events feature.

// Line 163 -- App Config
export const APP_CONFIG_PROD_URL = `https://app-config.workers.bsky.app`
// Decision: stand up equivalent or disable remote app config.
// This serves runtime configuration like feature toggles and
// content policy updates.
```

For launch, the simplest approach is to leave these pointing at Bluesky's
endpoints (they're public APIs that serve the AT Protocol network) and
replace them with Blacksky equivalents when those services exist. The app
handles failures gracefully -- geolocation falls back to empty strings,
live events and app config degrade to defaults.

### Verification

1. Trigger a manual iOS testflight build via `build-submit-ios.yml` and
   confirm the job runs (not skipped by repo guard).
2. Trigger a manual Android testflight build via `build-submit-android.yml`.
3. Push to main and confirm `bundle-deploy-eas-update.yml` runs the
   fingerprint check.
4. Confirm `sync-internal.yaml` no longer exists.
5. Confirm the 5 upstream container workflows no longer exist.
6. Verify the IPA artifact name matches the path in the workflow after the
   first successful iOS build.

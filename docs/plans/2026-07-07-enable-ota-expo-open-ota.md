# Enable OTA Updates via self-hosted expo-open-ota Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn on OTA updates in the Blacksky client, pointed at the self-hosted
expo-open-ota server at `https://updates.blacksky.community`, replacing the
disabled Bluesky "Denis" configuration.

**Architecture:** The `expo-updates` client runtime is standard and only needs
its `updates.url` and code-signing config repointed. Channel selection moves
from Denis-style runtime `extra-params` to the standard `expo-channel-name`
request header: baked into the build for production/testflight, and overridden
at runtime for PR previews via `setUpdateURLAndRequestHeadersOverride`.
Publishing switches from the custom `bundleUpdate.sh` (which spoke Denis's
`/v1/upload` protocol, absent on expo-open-ota) to the `eoas` CLI, which runs
`expo export` and uploads via expo-open-ota's native endpoints.

**Tech Stack:** React Native / Expo (`expo-updates@~29.0.17`), GitHub Actions,
`eoas` CLI, expo-open-ota (Go, Expo Updates protocol v1).

---

## Key facts (verified against current repo state)

- OTA is currently disabled: `app.config.js:39` `const UPDATES_ENABLED = false`.
- `updates` block: `app.config.js:230-244`, url `https://updates.bsky.app/manifest`.
- `runtimeVersion: {policy: 'appVersion'}` (`app.config.js:57-59`); app version `1.126.0` (`package.json:3`).
- EAS project id `680dd4a3-7b77-4a43-8f10-f14617b73b9b` (`app.config.js:470`).
- `IS_TESTFLIGHT` derives from `EXPO_PUBLIC_ENV === 'testflight'` (`src/env/common.ts:26`; also recomputed at `app.config.js:21`).
- OTA runtime hook: `src/lib/hooks/useOTAUpdates.ts` (channel set via `setExtraParamAsync('channel', ...)` at lines 19-40).
- PR deep-link handler: `src/lib/hooks/useIntentHandler.ts:85-93` -> `tryApplyUpdate(channel)`.
- PR hook consumer: `src/screens/Settings/Settings.tsx` (lines ~384-430).
- CI publish (main): `.github/workflows/bundle-deploy-eas-update.yml:127-141`.
- CI publish (PR): `.github/workflows/pull-request-comment.yml:181-210`.
- Both workflows already auth to Expo via `secrets.EXPO_TOKEN` (bundle-deploy line 100, pr-comment line 160).
- Cert already updated by user: `code-signing/certificate.pem` (modified in git status).
- `setUpdateURLAndRequestHeadersOverride` not yet imported anywhere; supported by `expo-updates@29`.

---

## Task 0: Backend prerequisites (OUT OF SCOPE - handled by user)

The signing key pair is confirmed to match the committed
`code-signing/certificate.pem`, and Expo channel/branch setup + server DNS
(`updates.blacksky.community`) are being handled by the user out of band. This
task is intentionally skipped in this implementation. Live end-to-end
verification (Task 9 steps that hit the server) will pass only once DNS
resolves.

---

## Task 1: Repoint the client `updates` block

**Files:**
- Modify: `app.config.js:34-39` (remove `UPDATES_ENABLED` flag + comment)
- Modify: `app.config.js:230-244` (the `updates` block)

**Step 1: Remove the disable flag + stale comment (lines 34-39)**

Delete:
```js
  // OTA updates are disabled: Blacksky has no update server yet. The url and
  // code-signing cert in the `updates` block still point at Bluesky's
  // infrastructure, so OTA must stay off until EAS Update (or a self-hosted
  // manifest signed with a Blacksky cert) is configured. New builds ship via
  // EAS build in the meantime.
  const UPDATES_ENABLED = false
```

**Step 2: Replace the `updates` block (lines 230-244)**

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

Notes:
- `IS_TESTFLIGHT` is already defined at `app.config.js:21`; no import needed.
- `requestHeaders` bakes the channel per build (Case 1 from design discussion).
- `checkAutomatically: 'NEVER'` retained: `useOTAUpdates` drives checks manually.

**Step 3: Verify config resolves**

Run: `pnpm exec expo config --type public > /dev/null && echo OK`
Expected: `OK`, no throw. Confirm the printed config's `updates.url` is the
blacksky URL and `updates.enabled` is `true` for a non-testflight resolution.

**Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS (config is JS; this guards nothing broke in app-wide types).

**Step 5: Commit**

```bash
git add app.config.js
git commit -m "feat(ota): repoint updates to updates.blacksky.community and enable"
```

---

## Task 2: Simplify the normal-path channel handling in useOTAUpdates

Channel now comes from the baked `expo-channel-name` header, so the Denis-era
`setExtraParamAsync('channel', ...)` is redundant. Keep the build-number extra
param (harmless telemetry, ignored by expo-open-ota).

**Files:**
- Modify: `src/lib/hooks/useOTAUpdates.ts:19-30` (`setExtraParams`)

**Step 1: Drop the channel extra-param from `setExtraParams`**

Before (lines 19-30):
```ts
async function setExtraParams() {
  await setExtraParamAsync(
    IS_IOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
  await setExtraParamAsync(
    'channel',
    IS_TESTFLIGHT ? 'testflight' : 'production',
  )
}
```

After:
```ts
async function setExtraParams() {
  // Channel is now carried by the baked-in `expo-channel-name` request header
  // (see app.config.js `updates.requestHeaders`). expo-open-ota resolves the
  // channel from that header, so we no longer set it as an extra param.
  await setExtraParamAsync(
    IS_IOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
}
```

**Step 2: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. (`IS_TESTFLIGHT` is still used elsewhere in the file, so no
unused-import error; verify no lint warning about it.)

**Step 3: Commit**

```bash
git add src/lib/hooks/useOTAUpdates.ts
git commit -m "refactor(ota): drop redundant channel extra-param (header-driven now)"
```

---

## Task 3: PR-preview path uses runtime header override

> **UPDATE (implemented then DISABLED per decision):** This task was implemented
> as written below, but review found a blocker:
> `setUpdateURLAndRequestHeadersOverride` throws `ERR_UPDATES_RUNTIME_OVERRIDE`
> on iOS/Android unless `updates.disableAntiBrickingMeasures: true` is set in
> `app.config.js`. That flag ships in production and weakens the embedded-update
> brick-recovery safety net (Expo warns it "should not be used in production"),
> so the decision was to leave the flag OFF and disable the PR-preview apply
> path for now. The runtime-override machinery was removed and the apply path is
> now gated behind a `PR_OTA_PREVIEWS_ENABLED = false` constant in
> `src/lib/hooks/useOTAUpdates.ts` - `tryApplyUpdate` short-circuits with an
> "Unavailable" alert. Normal production/testflight OTA (baked
> `expo-channel-name` header) is unaffected and fully working. CI still
> publishes PR bundles; they just cannot be applied on-device. To re-enable:
> set the flag, restore the runtime override in `tryApplyUpdate`, flip
> `PR_OTA_PREVIEWS_ENABLED` to `true`, and rebuild the native binaries. The
> original task content below is retained for historical reference.

PR previews override the channel at runtime on an already-installed build
(Case 2). Replace the extra-param mechanism with
`setUpdateURLAndRequestHeadersOverride`, and clear the override on revert.

**Files:**
- Modify: `src/lib/hooks/useOTAUpdates.ts` (import line 4-11; `setExtraParamsPullRequest` 32-40; `useApplyPullRequestOTAUpdate` 68-122)

**Step 1: Import the override API**

Before (lines 4-11):
```ts
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  useUpdates,
} from 'expo-updates'
```

After:
```ts
import {
  checkForUpdateAsync,
  fetchUpdateAsync,
  isEnabled,
  reloadAsync,
  setExtraParamAsync,
  setUpdateURLAndRequestHeadersOverride,
  useUpdates,
} from 'expo-updates'
```

**Step 2: Add the OTA URL as a module constant**

Add near the top of the file (after imports, before `MINIMUM_MINIMIZE_TIME`):
```ts
const OTA_MANIFEST_URL = 'https://updates.blacksky.community/manifest'
```

**Step 3: Replace `setExtraParamsPullRequest` (lines 32-40) with a header override**

Before:
```ts
async function setExtraParamsPullRequest(channel: string) {
  await setExtraParamAsync(
    IS_IOS ? 'ios-build-number' : 'android-build-number',
    // Hilariously, `buildVersion` is not actually a string on Android even though the TS type says it is.
    // This just ensures it gets passed as a string
    `${nativeBuildVersion}`,
  )
  await setExtraParamAsync('channel', channel)
}
```

After:
```ts
function overrideChannel(channel: string) {
  // PR previews retarget an already-installed build to a different channel at
  // runtime. expo-open-ota selects the channel from the `expo-channel-name`
  // header, so we override it (and re-assert our manifest URL) live.
  setUpdateURLAndRequestHeadersOverride({
    updateUrl: OTA_MANIFEST_URL,
    requestHeaders: {'expo-channel-name': channel},
  })
}

function clearChannelOverride() {
  // Reset to the build's baked-in updates config (production/testflight).
  setUpdateURLAndRequestHeadersOverride(null)
}
```

**Step 4: Update `useApplyPullRequestOTAUpdate` (lines 68-122)**

In `tryApplyUpdate`, replace `await setExtraParamsPullRequest(channel)` with
`overrideChannel(channel)`. In `revertToEmbedded`, clear the override before
falling back:

```ts
  const tryApplyUpdate = async (channel: string) => {
    setPending(true)
    overrideChannel(channel)
    const res = await checkForUpdateAsync()
    // ... unchanged Alert / fetchUpdateAsync / reloadAsync flow ...
    setPending(false)
  }

  const revertToEmbedded = async () => {
    try {
      clearChannelOverride()
      await updateTestflight()
    } catch (e: any) {
      logger.error('Internal OTA Update Error', {error: `${e}`})
    }
  }
```

**Step 5: Typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. Confirm `setExtraParamAsync` is still imported/used (Task 2 kept
the build-number call), else remove the now-unused import.

**Step 6: Commit**

```bash
git add src/lib/hooks/useOTAUpdates.ts
git commit -m "feat(ota): switch PR previews to setUpdateURLAndRequestHeadersOverride"
```

---

## Task 4: Add the eoas CLI, drop the make-deploy-bundle script

**Files:**
- Modify: `package.json` (devDependencies + scripts around lines 89-91)

**Step 1: Add `eoas` as a dev dependency**

Run: `pnpm add -D eoas`
(If the package name differs on the registry, resolve from the expo-open-ota
`apps/eoas` package.json `name` field and use that. Pin the installed version.)

**Step 2: Replace the deploy script**

Before (`package.json:91`):
```json
    "make-deploy-bundle": "bash scripts/bundleUpdate.sh",
```

After:
```json
    "publish-ota": "eoas publish --nonInteractive",
```
(Branch/platform are passed by CI; keeping the base script parameter-light.)

**Step 3: Verify eoas is runnable**

Run: `pnpm exec eoas --help`
Expected: prints `publish` / `init` command help (confirms install + binary).

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build(ota): add eoas CLI, replace make-deploy-bundle script"
```

---

## Task 5: Switch the main-branch deploy workflow to eoas

**Files:**
- Modify: `.github/workflows/bundle-deploy-eas-update.yml:127-141`

**Step 1: Replace the "Create Bundle" + "Package Bundle and Deploy" steps**

Before (lines 127-141):
```yaml
      - name: 🏗️ Create Bundle
        if: ${{ !steps.fingerprint.outputs.includes-changes }}
        run: >
          SENTRY_AUTH_TOKEN=${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_RELEASE=${{ steps.env.outputs.EXPO_PUBLIC_RELEASE_VERSION }}
          SENTRY_DIST=${{ steps.env.outputs.EXPO_PUBLIC_BUNDLE_IDENTIFIER }}
          pnpm export

      - name: 📦 Package Bundle and 🚀 Deploy
        if: ${{ !steps.fingerprint.outputs.includes-changes }}
        run: pnpm use-build-number bash scripts/bundleUpdate.sh
        env:
          DENIS_API_KEY: ${{ secrets.DENIS_API_KEY }}
          RUNTIME_VERSION: ${{ inputs.runtimeVersion }}
          CHANNEL_NAME: ${{ inputs.channel || 'testflight' }}
```

After:
```yaml
      - name: 🚀 Publish OTA Update (eoas)
        if: ${{ !steps.fingerprint.outputs.includes-changes }}
        run: >
          pnpm use-build-number pnpm exec eoas publish
          --branch=${{ inputs.channel || 'testflight' }}
          --platform=all
          --nonInteractive
          --dumpSourcemap
          --message="${{ github.event.head_commit.message || github.sha }}"
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_RELEASE: ${{ steps.env.outputs.EXPO_PUBLIC_RELEASE_VERSION }}
          SENTRY_DIST: ${{ steps.env.outputs.EXPO_PUBLIC_BUNDLE_IDENTIFIER }}
```

Notes:
- `eoas publish` runs `expo export` internally, so the separate export step is gone.
- Auth via existing `EXPO_TOKEN` (already used by the `expo/expo-github-action`
  setup step at line 100); `DENIS_API_KEY` is no longer referenced.
- `--branch` uses the channel name; Expo maps channel->branch (see Task 0).
- Keep `pnpm use-build-number` wrapper: eoas reads native build numbers from env
  for its manifest metadata.

**Step 2: Validate workflow YAML**

Run: `pnpm dlx @action-validator/cli .github/workflows/bundle-deploy-eas-update.yml`
(or `actionlint` if available)
Expected: no schema errors.

**Step 3: Commit**

```bash
git add .github/workflows/bundle-deploy-eas-update.yml
git commit -m "ci(ota): publish via eoas to expo-open-ota on main"
```

---

## Task 6: Switch the PR-comment workflow to eoas + fix the deep link

**Files:**
- Modify: `.github/workflows/pull-request-comment.yml:181-210`

**Step 1: Replace the deploy steps (lines 181-193)**

Before:
```yaml
      - name: 🏗️ Create Bundle
        run: >
          SENTRY_AUTH_TOKEN=${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_RELEASE=${{ steps.env.outputs.EXPO_PUBLIC_RELEASE_VERSION }}
          SENTRY_DIST=${{ steps.env.outputs.EXPO_PUBLIC_BUNDLE_IDENTIFIER }}
          pnpm export

      - name: 📦 Package Bundle and 🚀 Deploy
        run: pnpm use-build-number bash scripts/bundleUpdate.sh
        env:
          DENIS_API_KEY: ${{ secrets.DENIS_API_KEY }}
          CHANNEL_NAME: pull-request-${{ github.event.issue.number }}
          RUNTIME_VERSION:
```

After:
```yaml
      - name: 🚀 Publish PR OTA Update (eoas)
        run: >
          pnpm use-build-number pnpm exec eoas publish
          --branch=pull-request-${{ github.event.issue.number }}
          --platform=all
          --nonInteractive
          --message="PR #${{ github.event.issue.number }}"
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_RELEASE: ${{ steps.env.outputs.EXPO_PUBLIC_RELEASE_VERSION }}
          SENTRY_DIST: ${{ steps.env.outputs.EXPO_PUBLIC_BUNDLE_IDENTIFIER }}
```

Note: `eoas publish --branch=pull-request-N` creates the branch if absent. The
matching channel must also exist and be mapped; if the eoas/dashboard flow does
not auto-map, add a preceding step:
`pnpm exec eoas ...` channel mapping, or `pnpm dlx eas-cli channel:create pull-request-${N}`.
Confirm behavior during Task 9 and add the step only if the map is missing.

**Step 2: Fix the deep link + QR in the success comment (lines 205, 207)**

The current comment uses Bluesky's scheme and QR service, which will not open
the Blacksky app.

Before:
```yaml
            <img src="https://bsky-qr.vercel.app?channel=pull-request-$ISSUE_NUMBER" width=300 height=300>

            `bluesky://intent/apply-ota?channel=pull-request-${{ github.event.issue.number }}`
```

After:
```yaml
            `blacksky://intent/apply-ota?channel=pull-request-${{ github.event.issue.number }}`
```
(Drop the `<img>` QR line unless a Blacksky QR service exists; the deep link
alone is sufficient. `useIntentHandler.ts:85-93` already parses this scheme.)

**Step 3: Validate workflow YAML**

Run: `pnpm dlx @action-validator/cli .github/workflows/pull-request-comment.yml`
Expected: no schema errors.

**Step 4: Commit**

```bash
git add .github/workflows/pull-request-comment.yml
git commit -m "ci(ota): publish PR previews via eoas; fix apply-ota deep link scheme"
```

---

## Task 7: Delete the dead Denis publish scripts

**Files:**
- Delete: `scripts/bundleUpdate.sh`
- Delete: `scripts/bundleUpdate.js`

**Step 1: Confirm no remaining references**

Run: `grep -rn "bundleUpdate" --include='*.sh' --include='*.js' --include='*.json' --include='*.yml' .`
Expected: no matches after Tasks 4-6 (only historical mentions in `docs/`).

**Step 2: Delete**

```bash
git rm scripts/bundleUpdate.sh scripts/bundleUpdate.js
```

**Step 3: Commit**

```bash
git commit -m "chore(ota): remove Denis-era bundleUpdate scripts"
```

---

## Task 8: Update docs

**Files:**
- Modify: `docs/cicd-changes.md` (§1 – rewrite target from EAS Update to self-hosted expo-open-ota + eoas)
- Modify: `docs/deploy-ota.md` (replace the manual GH-Actions Denis procedure with the eoas/expo-open-ota flow)

**Step 1: Rewrite `docs/cicd-changes.md` §1**

Replace the "Switch to EAS Update" content with the actual decision: self-hosted
expo-open-ota at `updates.blacksky.community`, publishing via `eoas`, channel via
`expo-channel-name` header (baked for prod/testflight, runtime override for PR),
and the Task 0 backend prerequisites (channel/branch mapping, signing key match).

**Step 2: Update `docs/deploy-ota.md`**

Replace step 5's "run Bundle and Deploy EAS Update workflow (Denis)" with the
eoas-based flow and the manifest smoke-test from Task 0 step 3.

**Step 3: Commit**

```bash
git add docs/cicd-changes.md docs/deploy-ota.md
git commit -m "docs(ota): document self-hosted expo-open-ota + eoas publish flow"
```

---

## Task 9: End-to-end verification

No unit tests exist for OTA; verify against a real build + server.

**Step 1: Local export sanity**

Run: `pnpm exec eoas publish --branch=testflight --platform=all --nonInteractive --message="ota smoke test"`
(with `EXPO_TOKEN` exported locally, against a throwaway/testflight branch)
Expected: export succeeds, upload completes, `markUpdateAsUploaded` returns 200.

**Step 2: Manifest is served and signed**

Re-run the Task 0 step 3 curl. Expected: HTTP 200 with an `expo-signature:
sig="...", keyid="main"` header and a JSON manifest body.

**Step 3: On-device apply**

Install a testflight build carrying the updated `code-signing/certificate.pem`
and blacksky `updates.url`. Publish a visible JS-only change, background the app
15+ min (or use Settings > OTA controls), and confirm it downloads + reloads.
Expected: the change appears; no signature-rejection errors in logs.

**Step 4: PR preview apply**

Trigger the PR OTA workflow on a test PR, open the
`blacksky://intent/apply-ota?channel=pull-request-<n>` link on device, confirm
`useApplyPullRequestOTAUpdate.tryApplyUpdate` overrides the channel and pulls the
PR bundle. Then exercise "revert to embedded" and confirm the override clears.

**Step 5: Final commit / PR**

```bash
git add -A
git commit -m "chore(ota): finalize expo-open-ota enablement"
```
Open a PR from this branch; do not merge until Steps 1-4 pass.

---

## Open risks / watch-items

- **[RESOLVED - deferred] anti-bricking / PR-preview runtime override:** The
  `setUpdateURLAndRequestHeadersOverride` path used for PR previews (Task 3)
  requires `updates.disableAntiBrickingMeasures: true` in `app.config.js`, which
  ships in production and weakens the brick-recovery safety net. Decision: leave
  the flag OFF and disable PR-preview apply (`PR_OTA_PREVIEWS_ENABLED = false`).
  Previews are off and the flag is not set, so this risk does not apply to the
  shipped build. Revisit only if PR-preview apply is re-enabled.
- **runtimeVersion policy:** app uses `{policy: 'appVersion'}`. Confirm `eoas
  publish` resolves the policy to `1.126.0` and stamps published updates with it
  (client sends `expo-runtime-version: 1.126.0`). If eoas requires a concrete
  string, pass it explicitly or set via env in CI.
- **PR channel auto-mapping:** verify eoas creates *and maps* the
  `pull-request-<n>` channel->branch; add an explicit map step if not (Task 6).
- **Sourcemaps/Sentry:** `--dumpSourcemap` plus the Sentry env vars must still
  upload symbols; confirm Sentry release matches the app's release version.
- **eas.json channels** (`preview`->production, dev->development) are for `eas
  build`, not OTA; no change needed, but note dev builds won't OTA unless a
  `development` branch/channel is published to.

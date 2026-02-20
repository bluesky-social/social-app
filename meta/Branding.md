# Branding Migration Map

This file maps where this fork still references Bluesky branding/support/analytics so maintainers can systematically replace them with fork-owned equivalents.

## Scope and source

Scan commands used:

- `rg -l -S 'Bluesky|bluesky|bsky\.app|app\.bsky|@bsky\.app|xyz\.blueskyweb\.app' .`
- `rg -l -S 'support@bsky\.app|security@bsky\.app|bsky\.social/about/support|terms of service|privacy-policy|feedback' .`
- `rg -l -S 'sentry|@sentry|posthog|analytics|telemetry|bugsnag|rollbar|datadog' src docs package.json README.md`

Current hit counts at time of writing:

- Branding/domain/package identifiers: **458 files**
- Support links and policy references: **95 files**
- Analytics/error collection references: **187 files**

## 1) Branding replacement map (Bluesky → your fork)

### High-priority clusters

1. **Root metadata and docs**
   - `README.md`
   - `package.json`
   - `docs/build.md`, `docs/deploy-ota.md`
2. **Web app and server surface**
   - `bskyweb/templates/*.html`
   - `bskyweb/cmd/bskyweb/*.go`
   - `bskyweb/cmd/embedr/*.go`
3. **Mobile modules and app identifiers**
   - `modules/BlueskyClip/*`
   - `modules/Share-with-Bluesky/*`
   - `modules/BlueskyNSE/*`
   - `modules/expo-bluesky-*/*`
   - `modules/expo-receive-android-intents/android/src/main/java/xyz/blueskyweb/...`
4. **UI copy and UX strings in app screens**
   - `src/screens/**/*`
   - `src/components/**/*`

### Common replacement classes

- Product name strings: `Bluesky` / `Bluesky Social`
- Domains and hosts: `bsky.app`, `bsky.social`, `embed.bsky.app`, `public.api.bsky.app`, `go.bsky.app`
- Identifiers and namespaces: `xyz.blueskyweb.app`, `app.bsky.*`, `@bsky.app/*`

## 2) Support links map (move to your own systems)

### Confirmed support/legal touchpoints

- `README.md` (security disclosure and forking guidance)
- `src/screens/Settings/AboutSettings.tsx` (TOS and privacy policy links)
- `src/screens/Settings/components/DeleteAccountDialog.tsx` (FAQ/help)
- `src/screens/Takendown.tsx` (terms links)
- `bskyweb/cmd/bskyweb/server.go` (rate-limit support email)
- `bskyweb/cmd/embedr/server.go` (rate-limit support email)

### Replacement checklist

- [ ] Replace support inboxes (e.g. `support@bsky.app`, `security@bsky.app`)
- [ ] Replace legal links (ToS, privacy, FAQ)
- [ ] Replace feedback/contact destinations (issue templates, app links, forms)

## 3) Analytics and error collection map

### Confirmed telemetry/error integrations

- `package.json`
  - `@sentry/react-native`
  - `@sentry/webpack-plugin`
  - `upload-native-sourcemaps` script
- `docs/build.md`
  - Sentry setup docs/instructions
- `src/analytics/**/*`
  - App analytics event pipeline and metrics definitions

### Replacement checklist

- [ ] Swap Sentry DSN/tokens and upload workflow to your own org/project
- [ ] Replace or fork analytics pipeline under `src/analytics/*`
- [ ] Update docs so contributors do not send telemetry/errors to Bluesky infra

## Suggested rollout order

1. **Public-facing text + links first** (README, legal/support URLs, app store IDs)
2. **Identifiers and package names** (bundle IDs, module names, namespaces)
3. **Analytics/error sinks** (Sentry + event destinations)
4. **Long tail cleanup** across strings/docs/tests

---

If you want this converted into an actionable migration board, create a `meta/Branding.todo.md` with one checkbox per file path from each `rg -l` output and track completion by owner.

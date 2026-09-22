# Navigation

Expo Router owns the navigation container, linking, and route registration.
`index.ts` loads platform setup before `expo-router/entry`; `src/app/_layout.tsx`
retains the existing application providers.

## Layouts

- `src/app/(tabs)/_layout.tsx` uses JavaScript tabs with the existing bottom bar
  and drawer on iOS and Android. Each tab retains its own stack.
- The web layout uses `Slot`, and navigation stays in the home group to retain
  the single browser stack and existing public URLs.
- The shared `(home,search,messages,notifications,profile)` group registers
  screens in each native stack. Its layout uses `Stack.tsx`, which connects the
  existing authentication gates and web screen cache to Expo Router through
  `withLayoutContext`. Set both the group-specific `unstable_settings` and the
  stack's `initialRouteName`: cold links need the former for back destinations,
  while lazily opened tabs need the latter with the explicit screen ordering.
- Screens remain in `src/screens` and `src/view/screens`. Route files adapt their
  existing props through `createRouteScreen`; screen bodies do not belong in
  `src/app`.

## Navigation APIs

New code can use `useRouter`, `Link`, and `useLocalSearchParams` from `expo-router`.
Existing code uses the typed named-screen adapter in `index.ts`. Its push,
replace, back, and parameter methods delegate to Expo Router, while its state
adapter keeps screen identifiers stable for analytics and tab-selection UI.
Use Expo Router's package entry points for navigator types and lifecycle APIs;
do not reintroduce application imports from `@react-navigation/*`.

When adding a screen, add its route file and its options in `routeConfig.ts`.
The existing `src/routes.ts` map is retained for public link construction and
named-screen callers. Keep those mappings aligned with the route file.
Parameters are decoded strings at the screen boundary; booleans used by existing
screens are normalized explicitly. Pass raw dynamic values, not pre-encoded
strings, and keep route parameters serializable.

`+native-intent.tsx` normalizes universal links, `bluesky://`, `bsky://`, and Expo
development URLs. Existing intent handlers still process the original incoming
URL. Warm compose/verification intents preserve the current screen; chat invite
links open over Home. Account switches and logout clear navigation history.

## Web builds

`pnpm build-web` exports a Metro SPA into `web-build`. `public/index.html` retains
the existing HTML splash and fonts. `scripts/post-web-build.js` copies Metro's
`_expo` and `assets` directories into `bskyweb/static` and updates the Go template.
The Go server serves these at `/_expo/*` and `/assets/*`. CDN deployments must
serve those paths alongside `/static/*`; SPA-only hosts must rewrite screen URLs
to `index.html`. The Go server continues to provide its existing HTML routes.

Web builds generate source maps and upload them when `SENTRY_AUTH_TOKEN` is set.
`SENTRY_DISABLE_AUTO_UPLOAD=true` skips the upload for local verification. Maps
stay in `web-build` and are not copied into the Go server's public assets.

`pnpm generate-web-stats-file` emits entry-bundle size data for CI. The old
`generate-webpack-stats-file` command remains an alias so comparisons against
pre-migration base commits still work.

Adding Expo Router changes the native dependency graph. Build a new development
client before testing on devices; an existing pre-migration binary cannot gain
the new native module through an OTA update.

## Verification

Run `pnpm typecheck`, `pnpm lint`, `pnpm prettier`, and `pnpm test --runInBand`.
The navigation tests exercise the production auth-aware stack, cold links, tab
history, notifications, account resets, and URL encoding. They can also run with
`pnpm test --runInBand --preset jest-expo/android src/lib/navigation/navigation.test.tsx`.

With the local E2E server and a freshly built E2E client running, execute
`pnpm e2e:run __e2e__/flows/router-navigation.yml __e2e__/flows/login.yml`.
The routing flow covers signed-out links followed by sign-in, all five native
tabs, independent tab history, repeated-tab reset, Android hardware back,
account switching, logout, and warm compose intents. On Android,
reverse ports 3000 and 8081 with `adb reverse tcp:3000 tcp:3000` and
`adb reverse tcp:8081 tcp:8081` so the emulator reaches the local PDS and Metro.
The fixture server does not provide a chat backend or push delivery; the
Messages assertion checks navigation to the screen, not conversation delivery.

Cold-launch links need a standalone build because Expo's development launcher
intercepts them before the app loads. Build one with
`EXPO_PUBLIC_ENV=e2e EAS_BUILD_PLATFORM=android pnpm prebuild --platform android --no-install`
followed by `pnpm e2e:build-android --variant release`, then run
`pnpm e2e:run __e2e__/standalone/router-cold-link.yml` against the local fixture
server. The E2E configuration allows its local HTTP server in standalone Android
builds. Keep this flow outside the default development-client suite.

For release validation, check logged-in and logged-out navigation on devices,
Android hardware back, iOS back gestures, notification account switching, chat
invites, and starter-pack dialog return behavior. On web, check direct URLs,
reload, back/forward, modifier-click links, and scroll restoration at phone and
desktop widths.

# iOS 26 / Xcode 26 Crash & Breakage Audit

**Date:** 2026-06-23
**App:** Blacksky 1.122.0
**Stack:** Expo SDK 54, React Native 0.81.5, Xcode 26.0, Old Architecture
**Deployment Target:** iOS 15.1

---

## Executive Summary

The app compiles and runs but has **3 confirmed crash patterns** on iOS 26 devices and
several latent risks. The build requires 8 Xcode 26-specific patches (4 for RN, 3 for
Reanimated, 1 for Screens). The biggest operational gap is **no JS error visibility** in
production -- Sentry is misconfigured and there's no global error handler.

---

## Confirmed Crashes (from TestFlight reports)

| # | Issue | Status | Root Cause |
|---|-------|--------|------------|
| 1 | UITextView shadow OOB (`insertReactSubview:atIndex:` beyond bounds) | **Fixed** (`6c20c7379`) | iOS 26 TextKit 2 changes subview/layout fragment lifecycle, causing shadow tree child count mismatch |
| 2 | Garbled post counts (Lingui hash IDs rendered as text) | **Fixed** (catalog updated + `stripMessageField: false`) | `msg()` + `ph()` refactor created new message IDs; production babel strips message fallback |
| 3 | Crash-on-launch boot loop (4 reports, 1 user) | **Undiagnosed** | JS fatal with 80-100 frame Yoga recursion. No JS stack available. Likely corrupted persisted state or unbounded view tree |

---

## Critical Risks

### 1. No JS Error Visibility

- **No `ErrorUtils.setGlobalHandler`** configured anywhere
- **Sentry org/project mismatch**: dSYM upload goes to `blueskyweb/app` but Expo plugin references `blacksky-algorithms/social-app`
- **Sentry sample rate: 10%** for non-internal users
- **No dSYM upload** in the auto-triggered `buildIfNecessaryIOS` workflow

**Impact:** You cannot diagnose JS crashes in production. The crash-on-launch loop is a black box.

**Fix:** Align Sentry org/project, add global error handler to metrics pipeline, bump sample rate.

### 2. UITextView Nesting (TextKit 2 incompatibility)

10 files still use the deprecated `Text_DEPRECATED` component which **always** renders UITextView on iOS:
- `screens/Search/components/AutocompleteResults.tsx`
- `components/Post/Embed/PostPlaceholder.tsx`
- `view/screens/PrivacyPolicy.tsx`
- `view/screens/Debug.tsx`
- `view/screens/TermsOfService.tsx`
- `view/screens/CommunityGuidelines.tsx`
- `view/screens/Feeds.tsx`
- `view/screens/NotFound.tsx`
- `view/screens/CopyrightPolicy.tsx`
- `view/com/profile/ProfileSubpageHeader.tsx`

Additionally, `screens/Hashtag.tsx` (lines 225-246) has a verified nested UITextView pattern via `<Text><Trans><InlineLinkText/></Trans></Text>`.

**Impact:** Potential OOB crashes or deep layout recursion on iOS 26 when these components render.

**Fix:** Migrate all 10 to `#/components/Typography`. Fix Hashtag.tsx nesting.

### 3. Persisted State Init Has No Timeout

`App.native.tsx` line 208: `initPersistedState()` must resolve before the app renders. If AsyncStorage hangs (corrupted data, iOS migration issue), the app shows a blank screen forever.

**Impact:** Could explain some "won't open" reports. Not a crash per se, but functionally identical.

**Fix:** Add a timeout (e.g., 5s) that falls back to defaults.

---

## Moderate Risks

### 4. Old Architecture (`newArchEnabled: false`)

The app runs on the legacy RCT Bridge. This is deliberate but means:
- Missing Fabric performance optimizations
- Some iOS 26 TurboModule fixes (like #54859) only apply to New Architecture
- `@miblanchard/react-native-slider` has no New Arch support

**Impact:** Not an immediate crash risk but limits compatibility path forward.

### 5. Deployment Target at 15.1

Xcode 26 may deprecate support below 16.0 in future point releases. No `post_install` clamp in the Podfile means pods can set their own targets lower, triggering warnings.

**Impact:** Build warnings now; potential build failures in Xcode 26.4+.

### 6. OTA Updates Disabled

```js
const UPDATES_ENABLED = false
// "Blacksky has no update server yet"
```

Combined with `appVersion` runtime policy (not `fingerprint`), this means every fix requires a full App Store/TestFlight build cycle.

**Impact:** Slow iteration on crash fixes. No hotfix capability.

### 7. High Patch Count (44 patches)

8 patches are specifically for Xcode 26 C++ strictness:
- `react-native+0.81.5+005` through `+008` (fmt, atomic bool, Hermes destructor, mutex include)
- `react-native-reanimated+3.19.1+002` and `+003` (stdlib includes)
- `react-native-screens+4.24.0` (atomic include)
- `react-native-pager-view+6.8.0` (iOS 26 gesture recognizer)

These are correct but represent tech debt. RN 0.84+ and Reanimated 4.x resolve most upstream.

---

## Low Risks

### 8. URL Encoding (iOS 26 stricter parsing)

`useOpenLink.ts` passes URLs from API data directly to `Linking.openURL` without sanitization. iOS 26's stricter RFC 3986 enforcement could reject URLs with unencoded characters.

**Impact:** Link failures, not crashes. Low probability with AT Protocol URLs.

### 9. C++ stdlib Behavior Shifts

Pods compiled as C++23 (forced in Podfile). Apple's libc++ changed `std::map`/`std::set` behavior for non-strict-weak-order comparators. Only affects custom C++ code using these patterns.

**Impact:** Subtle data structure bugs in native modules. Very unlikely given the module set.

### 10. expo-glass-effect SDK Mismatch

Requires a patch to work with Expo SDK 54. Will resolve on SDK 55 upgrade.

---

## What's NOT a Risk

| Item | Why |
|------|-----|
| ALAssetsLibrary | Not used anywhere |
| Metal shaders | No .metal files in the project |
| `use_frameworks!` | Conditional, not active |
| `performAndWait` (Core Data) | Not used |
| `ld_classic` linker | Not referenced |
| UIWebView / NSURLConnection | Only in third-party docs/comments, not code |
| TurboModule startup crash | Minimal native module surface; only EmojiPickerView uses @objc |

---

## Recommended Fix Priority

### Immediate (before next TestFlight)

1. **Fix Sentry configuration** -- align org/project so crash data actually flows
2. **Add global JS error handler** to metrics pipeline as backup
3. **Migrate 10 legacy Text usages** to Typography component
4. **Fix Hashtag.tsx nesting**

### Short-term (next sprint)

5. Add timeout to `initPersistedState()` with fallback to defaults
6. Add deployment target clamp in Podfile `post_install`
7. Investigate crash-on-launch loop once Sentry data is available
8. Add dSYM upload step to `buildIfNecessaryIOS` CI job

### Medium-term (next quarter)

9. Evaluate Expo SDK 55 / RN 0.83 upgrade (eliminates most Xcode 26 patches)
10. Enable OTA updates with `fingerprint` runtime policy
11. Evaluate New Architecture migration
12. Remove remaining `<Trans>` nesting patterns or keep Lingui patch

---

## Build Configuration Reference

```
Xcode: 26.0 (pinned in CI via setup-xcode)
Runner: macos-26-xlarge (self-hosted)
Node: 24.15.0
EAS: local builds only (no remote image pinned)
Sentry: @sentry/react-native ~6.20.0 (patched)
Hermes: 0.81.5 (bundled with RN)
Architecture: Old (Bridge)
```

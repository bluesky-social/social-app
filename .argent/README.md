# APP-3472 composer keyboard checks

These flows exercise empty composers only. They never publish or create drafts.
Existing signed-in accounts are required; no credentials are stored in the flows.
Both apps were left on Home with their keyboards closed after validation.

## Contract

| Flow | Start and actions | Acceptance and end state |
| --- | --- | --- |
| `app-3472-composer-keyboard` | Android Home, keyboard closed; tap `composeFAB` | Input and keyboard present, three media controls present, full-screen snapshot **before any keyboard toggle**; cancel returns to Home with input and keyboard absent |
| `app-3472-android-keyboard-toggle` | Android empty composer already open with keyboard visible; Back, then refocus input | Keyboard absent after Back and present after refocus; media controls present; composer stays open |
| `app-3472-ios-composer-keyboard` | Restart signed-in iOS app; open composer; Home button, foreground, refocus | Keyboard present initially, absent after background/foreground, present after refocus; media controls present; cancel returns to Home |

The Android toggle and iOS flows are structural lifecycle checks, not standalone
proof of toolbar geometry. Their walkthroughs also used live shared-value and
native frame measurements. Only the Android initial-entry flow contains a visual
regression assertion.

Each app-screen transition has a destination identity gate and an `idle` gate.
The iOS SpringBoard transition uses a raw accessibility wait for the installed
Bluesky icon before foregrounding. Its system keyboard checks also remain raw
`await-ui-element` calls: the app-scoped runner tree does not include the iOS
keyboard's `space` identifier. There are no coordinate-based taps in the saved
flows.

## Android baseline

The full-screen baseline is specific to the tested A063, 1080x2400 capture,
English UI, dark theme, current account avatar, and Gboard configuration. It was
captured from a working initial opening and inspected, but still requires human
review before commit. Do not refresh it to make a failing run pass.

The `maxMismatch: 0.1` threshold is intentional. Merely checking toolbar controls
as visible passes even when the keyboard obscures them. The natural unpatched
failure differed from the working screenshot by 0.43%, which would also pass
Argent's default 0.5% threshold. Ten consecutive patched replays differed by
0.00-0.02% without updating the baseline.

The initial-entry Android flow is a fragment because restarting this development
client can open Expo's server picker. Its declared Home prerequisite must be
established first. It is not a self-contained CI scenario.

## Replay

Pass the actual connected device id explicitly. Do not use `--update-baselines`
for validation.

```sh
argent flow run app-3472-composer-keyboard --platform android --device <android-serial>
argent flow run app-3472-android-keyboard-toggle --platform android --device <android-serial>
argent flow run app-3472-ios-composer-keyboard --platform ios --device <simulator-udid>
```

Before the Android toggle fragment, manually open an empty composer and verify
initial keyboard/toolbar placement. It leaves the composer open, so cancel it
afterward. The iOS flow requires the standard English software keyboard enabled.

## Evidence and limitations

The same MCP `flow-execute` runner performed ten consecutive final Android
initial-entry passes, two Android toggle passes, and two iOS lifecycle passes.
Android and iOS Argent services were recycled for each device before its first
pair of initial-entry/lifecycle replays, without resetting app or account data.

Android `idle` gates warned about continued motion: the accessibility tree still
included a playing Home-feed video behind the composer. iOS composer `idle`
gates warned about small moving content, consistent with the visible caret.
These are disclosed readiness warnings, not acceptance evidence. Keyboard,
input, toolbar, and screenshot checks executed independently of stillness.

Patch rationale, A/B results, and untested scope are recorded in
`patches/react-native-keyboard-controller@1.22.7.patch.md`.

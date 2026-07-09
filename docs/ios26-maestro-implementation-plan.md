# iOS 26 Maestro Robustness Test Plan

This worktree is intended to add a focused Maestro suite for the crash classes seen while porting Blacksky to newer iOS / React Native compatibility surfaces. The goal is not broad product coverage. The goal is to repeatedly exercise native surfaces that are likely to regress or crash on iOS 26 while keeping the tests deterministic enough to run locally and in CI.

## Current Baseline

- Branch: `ios26-e2e-robustness`
- App id for E2E builds: `community.blacksky.app`
- Metro E2E port: `8082`
- Existing Maestro flows live in `__e2e__/flows`
- Existing E2E setup files:
  - `__e2e__/setupServer.js`
  - `__e2e__/setupApp.yml`
  - `__e2e__/config.yml`
- Existing E2E-only route:
  - `SharedPreferencesTester`
  - screen: `src/screens/E2E/SharedPreferencesTesterScreen.tsx`
  - registered in `src/Navigation.tsx`
  - route type in `src/lib/routes/types.ts`
- Existing hidden E2E navigation controls:
  - `src/view/com/testing/TestCtrls.e2e.tsx`

The previous branch already has a working Maestro baseline. `__e2e__/flows/home-screen.yml` was verified against a booted simulator before this worktree was created.

## Local Environment Notes

Use Node 24 for the app / Metro:

```sh
PATH=/Users/rishibalakrishnan/.nvm/versions/node/v24.15.0/bin:$PATH yarn e2e:start
```

Use Node 20 for `dev-env`, because `better-sqlite3@10.1.0` does not build cleanly under Node 24 in the current setup:

```sh
cd dev-env
PATH=/Users/rishibalakrishnan/.nvm/versions/node/v20.20.0/bin:$PATH yarn start
```

Maestro CLI is installed at:

```sh
~/.maestro/bin/maestro
```

Maestro needs Java 17+. This machine has OpenJDK available here:

```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@25
export PATH="$HOME/.maestro/bin:/opt/homebrew/opt/openjdk@25/bin:$PATH"
```

Run a flow with:

```sh
maestro test __e2e__/flows/home-screen.yml
```

## Recommended Implementation Shape

Add a small number of E2E-only stress screens under:

```text
src/screens/E2E/
```

Register each screen in:

```text
src/lib/routes/types.ts
src/Navigation.tsx
src/view/com/testing/TestCtrls.e2e.tsx
```

Add Maestro flows under:

```text
__e2e__/flows/ios26/
```

Each flow should use the normal mock server and app setup:

```yaml
appId: community.blacksky.app
---
- runScript:
    file: ../../setupServer.js
    env:
      SERVER_PATH: ?users&follows&posts&feeds
- runFlow:
    file: ../../setupApp.yml
- tapOn:
    id: e2eSignInAlice
```

The extra route buttons should be hidden test controls in `TestCtrls.e2e.tsx`, following the existing one-pixel `Pressable` pattern:

```tsx
<Pressable
  testID="e2eGotoIos26BottomSheetStress"
  onPress={() => navigate('Ios26BottomSheetStress')}
  accessibilityRole="button"
  style={BTN}
/>
```

## Test Area 1: Bottom Sheet Lifecycle / Resizing

Why this matters:

- The app uses a custom native bottom sheet module through `src/components/Dialog/index.tsx`.
- iOS 26 / Liquid Glass changes can affect presentation, safe-area math, sheet corner radius, snap-point transitions, and keyboard inset behavior.
- Many app flows depend on `Dialog.Outer` and `Dialog.ScrollableInner`.

Add screen:

```text
src/screens/E2E/Ios26BottomSheetStressScreen.tsx
```

Route name:

```text
Ios26BottomSheetStress
```

Hidden control id:

```text
e2eGotoIos26BottomSheetStress
```

Suggested screen behavior:

- Render a `Layout.Screen` with a few visible buttons.
- Use `Dialog.useDialogControl()`.
- Render one or more `Dialog.Outer` instances.
- Include at least one `Dialog.ScrollableInner`.
- Include a dynamic content count that can be increased while the sheet is open.
- Include a `TextInput` inside the sheet to exercise keyboard-aware inset behavior.
- Include `testID`s for:
  - `ios26BottomSheetStressScreen`
  - `openBottomSheetStress`
  - `ios26BottomSheetDialog`
  - `growBottomSheetContent`
  - `focusBottomSheetInput`
  - `closeBottomSheetStress`

Suggested Maestro flow:

```text
__e2e__/flows/ios26/bottom-sheet-stress.yml
```

Suggested assertions/actions:

- Navigate with `e2eGotoIos26BottomSheetStress`.
- Assert `ios26BottomSheetStressScreen` visible.
- Open the sheet.
- Assert `ios26BottomSheetDialog` visible.
- Grow dynamic content several times.
- Scroll the sheet.
- Focus the input.
- Type text.
- Dismiss keyboard.
- Close sheet.
- Repeat open / close at least twice.

This flow should catch crashes in sheet presentation, scrollable inner layout, keyboard inset adjustment, and dialog lifecycle cleanup.

## Test Area 2: Selectable Text / UITextView

Why this matters:

- The app’s main `Text` component renders `react-native-uitextview` on iOS when `selectable` is true.
- The previous branch already patched nested `UITextView` behavior.
- iOS 26 text selection and text view changes are a likely crash surface.

Add screen:

```text
src/screens/E2E/Ios26SelectableTextScreen.tsx
```

Route name:

```text
Ios26SelectableText
```

Hidden control id:

```text
e2eGotoIos26SelectableText
```

Suggested screen behavior:

- Render a scrollable list of selectable text blocks.
- Include mixed content:
  - plain text
  - emoji text with `emoji`
  - long text with `numberOfLines`
  - nested text spans
  - mount / unmount toggles
- Include controls to:
  - toggle the selectable text list
  - change list size
  - force a rerender
- Include `testID`s for:
  - `ios26SelectableTextScreen`
  - `toggleSelectableTextList`
  - `increaseSelectableTextRows`
  - `forceSelectableTextRerender`
  - `selectableTextRow-0`

Suggested Maestro flow:

```text
__e2e__/flows/ios26/selectable-text.yml
```

Suggested assertions/actions:

- Navigate with `e2eGotoIos26SelectableText`.
- Assert screen visible.
- Toggle the selectable list off and on.
- Increase rows.
- Scroll through the list.
- Force rerender.
- Long-press a selectable row if Maestro can do it reliably on the simulator.
- Toggle the list again.

This flow should catch crashes in selectable text mounting, unmounting, nested text rendering, and repeated `UITextView` allocation.

## Test Area 3: Keyboard / Input Focus in Scroll Containers

Why this matters:

- Keyboard handling is a common iOS compatibility failure point.
- The app uses `react-native-keyboard-controller` and native keyboard-aware dialog behavior.
- iOS 26 changes may affect keyboard animation metrics, safe-area insets, and scroll adjustment.

Add screen:

```text
src/screens/E2E/Ios26KeyboardStressScreen.tsx
```

Route name:

```text
Ios26KeyboardStress
```

Hidden control id:

```text
e2eGotoIos26KeyboardStress
```

Suggested screen behavior:

- Render a `ScrollView` with inputs near top, middle, and bottom.
- Include a bottom input that requires scrolling into view.
- Include a button to focus a specific input.
- Include a button to clear/repopulate text.
- Include `testID`s for:
  - `ios26KeyboardStressScreen`
  - `keyboardTopInput`
  - `keyboardMiddleInput`
  - `keyboardBottomInput`
  - `focusKeyboardBottomInput`
  - `clearKeyboardInputs`

Suggested Maestro flow:

```text
__e2e__/flows/ios26/keyboard-stress.yml
```

Suggested assertions/actions:

- Navigate with `e2eGotoIos26KeyboardStress`.
- Type into top input.
- Scroll to bottom input.
- Type into bottom input.
- Clear inputs.
- Focus bottom input via button.
- Dismiss keyboard.
- Repeat a short focus / blur cycle.

This flow should catch keyboard focus crashes, scroll inset issues, and native text input layout regressions.

## Test Area 4: Existing Product Flows to Re-run on iOS 26

After the synthetic stress screens pass, run the existing product flows most likely to exercise the same native surfaces:

```text
__e2e__/flows/composer.yml
__e2e__/flows/composer-self-label.yml
__e2e__/flows/post-report-flow.yml
__e2e__/flows/mod-lists.yml
__e2e__/flows/profile-screen-edit.yml
__e2e__/flows/shared-prefs.yml
```

Prioritize these because they touch:

- composer text input
- media / alt text dialogs
- report dialogs
- moderation dialogs
- profile edit dialogs
- shared native storage

## Optional Package Scripts

Consider adding these scripts to `package.json`:

```json
{
  "e2e:run:ios26": "maestro test __e2e__/flows/ios26",
  "e2e:run:home": "maestro test __e2e__/flows/home-screen.yml"
}
```

Do not replace `e2e:mock-server` unless you want the repo to encode the local Node 20 workaround. If encoding it, prefer documenting it or adding a separate script rather than changing the existing script:

```json
{
  "e2e:mock-server:node20": "bash -lc 'export NVM_DIR=\"$HOME/.nvm\"; . \"$NVM_DIR/nvm.sh\" && nvm exec 20 yarn --cwd dev-env start'"
}
```

## Verification Checklist

Before committing:

1. Confirm TypeScript route names compile.
2. Confirm the E2E build still starts:

   ```sh
   PATH=/Users/rishibalakrishnan/.nvm/versions/node/v24.15.0/bin:$PATH yarn e2e:start
   ```

3. Start the mock server with Node 20:

   ```sh
   cd dev-env
   PATH=/Users/rishibalakrishnan/.nvm/versions/node/v20.20.0/bin:$PATH yarn start
   ```

4. Run at least one existing baseline flow:

   ```sh
   maestro test __e2e__/flows/home-screen.yml
   ```

5. Run each new iOS 26 flow:

   ```sh
   maestro test __e2e__/flows/ios26/bottom-sheet-stress.yml
   maestro test __e2e__/flows/ios26/selectable-text.yml
   maestro test __e2e__/flows/ios26/keyboard-stress.yml
   ```

6. If one of these crashes the app, collect:
   - Maestro failure output
   - simulator crash report
   - Sentry event if configured
   - exact simulator model and iOS version

## Implementation Order

1. Add route types for the three new E2E screens.
2. Add screen imports and stack registrations in `src/Navigation.tsx`.
3. Add hidden navigation controls in `TestCtrls.e2e.tsx`.
4. Implement `Ios26SelectableTextScreen`; this is the smallest and fastest first flow.
5. Implement `selectable-text.yml` and verify it.
6. Implement `Ios26KeyboardStressScreen` and `keyboard-stress.yml`.
7. Implement `Ios26BottomSheetStressScreen` and `bottom-sheet-stress.yml`.
8. Add optional package scripts.
9. Commit the doc, screens, route registrations, and flows together.

## Notes for the Next Agent

- Keep these screens E2E-only in spirit. They can live in normal source because `RN_SRC_EXT=e2e.ts,e2e.tsx` already enables E2E-specific code paths, but they should not be linked from real product UI.
- Prefer existing app primitives:
  - `Layout.Screen`
  - `#/components/Button`
  - `#/components/Typography`
  - `#/components/Dialog`
  - `#/view/com/util/Views`
- Avoid adding new native dependencies for this suite.
- Keep Maestro selectors based on stable `testID`s, not visible text, wherever possible.
- Do not make the flows depend on network content outside `dev-env`.
- The tests are primarily crash detectors. A flow that only asserts a few stable elements but heavily exercises native transitions is still valuable.

# iOS 26 TestFlight Crash Diagnosis

Date: 2026-06-30

## Summary

There appear to be at least two related-looking but distinct TestFlight issues in
release `1.122.0` on iOS 26:

1. Signup can emit `RangeError: Maximum call stack size exceeded (native stack depth)`.
2. Reporting to a moderation labeler can emit the same class of `RangeError`,
   then freeze or later be reported as a watchdog termination in Sentry.

The signup issue has a concrete component stack from live device logs. The
report-labeler issue now also has a live device log showing the same
`TransNoContext -> Trans -> RCTText -> Text -> Text` shape, while Sentry still
mostly sees the delayed watchdog outcome.

## Signup RangeError

Live device log excerpt:

```text
RangeError: Maximum call stack size exceeded (native stack depth)
componentStack:
  at TransNoContext
  at Trans
  at RCTText
  at Text
  at Text
  at Policies
```

Relevant code:

- `src/screens/Signup/StepInfo/Policies.tsx`

The suspicious render pattern is:

```tsx
els = (
  <Trans>
    By creating an account you agree to the{' '}
    <InlineLinkText>Terms of Service</InlineLinkText>
    ...
  </Trans>
)

return <Text>{els}</Text>
```

This creates a nested tree like:

```text
Text -> Trans -> InlineLinkText -> Text
```

On TestFlight/Hermes/iOS 26, that tree appears to recurse deeply enough to hit
the native stack-depth limit. This also explains why the app may show/log the
RangeError without producing a TestFlight crash report.

Sentry has an older matching issue:

- `SOCIAL-APP-2`
- `RangeError: Maximum call stack size exceeded (native stack depth)`
- Release `1.122.0`
- Platform `javascript`
- Hermes true
- React Native `0.81.5`

Sentry's stack for that issue repeats through `core-js` `Function.prototype.toString`
helpers, but the live device log adds the missing React component stack and points
to `Policies`.

### Signup Fix Hypothesis

Rewrite `Policies` so that it does not place `InlineLinkText` inside a Lingui
`<Trans>` block inside the app `<Text>` component. Prefer rendering plain text
segments and inline links explicitly, using `_` / `msg` for the individual
strings.

The goal is to remove this nesting:

```text
Text -> Trans -> InlineLinkText -> Text
```

## Report Labeler RangeError / Freeze / Watchdog

Sentry issue:

- `SOCIAL-APP-5`
- `WatchdogTermination: The OS watchdog terminated your app, possibly because it overused RAM.`
- Release `1.122.0`
- iOS `26.6`
- Device `iPhone14,7`
- Latest observed user: `464B70D8-038D-490D-A68D-CCECB9EF8801`

Observed behavior:

- Selecting the Blacksky labeler can crash quickly.
- Selecting another labeler can freeze longer and then crash.
- Recent Sentry events are watchdog terminations with no stacktrace.
- TestFlight crash reports may not send for the longer freeze/watchdog path.
- Live device logs can show an unhandled JS `RangeError` before scene/process
  invalidation.

Live device log excerpt for reporting:

```text
Unhandled JS Exception: RangeError: Maximum call stack size exceeded (native stack depth)

This error is located at:
  at TransNoContext
  at Trans
  at RCTText
  at Text
  at Text
  at RCTView
  at View
```

Related TestFlight feedback comments:

- "crashed after hitting report to blacksky labeler"
- "Crash happens when pressing Blacksky moderation service specifically after reporting."

TestFlight crash logs from those reports show:

```text
EXC_CRASH (SIGABRT)
RCTFatal
RCTExceptionsManager
RCTUIManager _manageChildren
REASwizzledUIManager reanimated_manageChildren
```

The older TestFlight crash logs point at a React Native native view
mutation/reconciliation failure during the report dialog transition. The newer
live device logs show that at least one report path is also hitting the same
`Trans`/nested text stack-depth failure as signup before iOS scene/process
cleanup begins.

### Report Dialog Risk Area

Relevant files:

- `src/components/moderation/ReportDialog/index.tsx`
- `src/components/moderation/ReportDialog/state.ts`
- `src/components/moderation/ReportDialog/action.ts`

Suspicious transition:

1. User selects a labeler.
2. Reducer handles `selectLabeler`.
3. `activeStepIndex1` moves to `4`.
4. The labeler list is replaced by the submit step inside a native dialog.

This unmounts the pressed labeler card/list while React Native is processing the
press and layout updates. In affected TestFlight logs, the native crash happens
around UIManager child removal.

New most suspicious render site:

- `src/components/moderation/ReportDialog/index.tsx`
- submit step copy around `Your report will be sent to ...`

Current shape:

```tsx
<Text>
  <Trans>
    Your report will be sent to{' '}
    <Text>{state.selectedLabeler?.creator.displayName}</Text>
    .
  </Trans>{' '}
  <InlineLinkText>
    <Trans>Add more details (optional)</Trans>
  </InlineLinkText>
</Text>
```

This has the same risky nested pattern:

```text
Text -> Trans -> Text
Text -> InlineLinkText -> Text -> Trans
```

This explains why the issue reproduces for different labelers: selecting any
labeler advances to the submit step and renders this text tree. Timing can vary
by labeler/device/session, so one labeler may crash quickly while another hangs
before the watchdog outcome.

### Report Fix Hypothesis

Rewrite the submit-step copy so that it does not put `<Trans>` around nested
`Text` or `InlineLinkText` children. Prefer explicit text segments translated
with `_` / `msg`, or a simpler layout with separate sibling `Text` and link
components.

## Additional Confirmed Repro Paths

The same `RangeError: Maximum call stack size exceeded (native stack depth)` has
now reproduced in other high-risk paths found by the codebase scan. This strongly
supports a general React Native/Lingui nested-text failure rather than a
report-labeler-specific API or state bug.

### Change Email / Resend Email

User action:

1. Open the email-change or verification flow.
2. Reach the state that renders the resend-email helper text.

Live device log excerpt:

```text
RangeError: Maximum call stack size exceeded (native stack depth)
componentStack:
  at TransNoContext
  at Trans
  at RCTText
  at Text
  at Text
  at ResendEmailText
```

Relevant code:

- `src/components/dialogs/EmailDialog/components/ResendEmailText.tsx`

Current shape:

```tsx
<Text>
  <Trans>
    Don't see an email?{' '}
    <InlineLinkText>Click here to resend.</InlineLinkText>
  </Trans>{' '}
  <Span>...</Span>
</Text>
```

This is the same risky shape:

```text
Text -> Trans -> InlineLinkText -> Text
```

### Labels Applied To My Post

User action:

1. Open a post authored by the current account that has a label.
2. Tap the label info button before starting an appeal.

Live device log excerpt:

```text
RangeError: Maximum call stack size exceeded (native stack depth)
componentStack:
  at TransNoContext
  at Trans
  at RCTText
  at Text
  at Text
  at RCTView
  at View
```

Relevant code path:

- `src/components/moderation/LabelsOnMe.tsx`
- `src/components/moderation/LabelsOnMeDialog.tsx`

The label button opens `LabelsOnMeDialog`. Before the appeal form is shown, each
non-self label renders source text like:

```tsx
<Text numberOfLines={1}>
  <Trans>
    Source:{' '}
    <InlineLinkText>{sourceName}</InlineLinkText>
  </Trans>
</Text>
```

This again creates:

```text
Text -> Trans -> InlineLinkText -> Text
```

The appeal form has a second similar site, but this repro happens earlier on the
initial label-details view.

### Labeled / Hidden Post Surface

There is also a nearby pre-dialog risk in `ContentHider` for labeled content:

```tsx
<Text>
  <Trans>Labeled by ...</Trans>{' '}
  <Text>
    <Trans>Learn more.</Trans>
  </Text>
</Text>
```

This creates:

```text
Text -> Trans
Text -> Text -> Trans
```

This is not identical to the `Trans -> InlineLinkText` shape, but it still has
nested text and translated children in one native text tree. It may explain
hangs/watchdog kills when merely rendering or tapping labeled post warnings.

### Change Handle Dialog

User action:

1. Open Settings.
2. Open the change-handle dialog.
3. Render the handle preview and domain-help text.

Live device log excerpt:

```text
RangeError: Maximum call stack size exceeded (native stack depth)
componentStack:
  at TransNoContext
  at Trans
  at RCTText
  at Text
  at Text
  at Text
```

Relevant code:

- `src/screens/Settings/components/ChangeHandleDialog.tsx`

Current risky shapes:

```tsx
<Text>
  <Trans>
    Your full handle will be <Text>@handle.example</Text>
  </Trans>
</Text>
```

```tsx
<Text>
  <Trans>
    If you have your own domain... <InlineLinkText>Learn more here.</InlineLinkText>
  </Trans>
</Text>
```

### Starter Pack Wizard Footer

User action:

1. Open the starter-pack wizard.
2. Add people or feeds so the footer renders dynamic included-item text.

Live device log excerpt:

```text
RangeError: Maximum call stack size exceeded (native stack depth)
componentStack:
  at TransNoContext
  at Trans
  at RCTText
  at Text
  at Text
  at RCTView
  at View
  at Footer
```

Relevant code:

- `src/screens/StarterPack/Wizard/index.tsx`

The footer has multiple branches like:

```tsx
<Text>
  <Trans>
    <Text>{name}</Text> and <Text>{name}</Text> are included in your starter pack
  </Trans>
</Text>
```

This is the same core pattern:

```text
Text -> Trans -> Text
```

### Email 2FA Disable

User action:

1. Open email 2FA management.
2. Open the disable-email-2FA flow.

Live device log excerpt:

```text
RangeError: Maximum call stack size exceeded (native stack depth)
componentStack:
  at TransNoContext
  at Trans
  at RCTText
  at Text
  at Text
  at RCTView
  at View
  at Disable
```

Relevant code:

- `src/components/dialogs/EmailDialog/screens/Manage2FA/Disable.tsx`

The initial disable step renders:

```tsx
<Text>
  <Trans>
    To disable your email 2FA method, please verify your access to{' '}
    <Span>{currentAccount?.email}</Span>
  </Trans>
</Text>
```

The same screen also has an inline-link variant:

```tsx
<Text>
  <Trans>
    Have a code? <InlineLinkText>Click here.</InlineLinkText>
  </Trans>
</Text>
```

This confirms that the crash is not limited to `InlineLinkText` or app `Text`.
`Span` inside `<Trans>` under an outer text wrapper is also unsafe on the
affected iOS 26/TestFlight build.

## Local Device Diagnostics

Temporary `console.info` logs with these prefixes were used during the
investigation, but they have been removed from the branch:

- `[ReportDialogDebug]`
- `[SignupDebug]`

This kind of log can be useful in live device logs, but it is not reliable for
Sentry or TestFlight crash reports.

To view similar live logs from a connected device:

1. Open macOS `Console.app`.
2. Select the connected iPhone.
3. Filter for `Blacksky`, `[ReportDialogDebug]`, or `[SignupDebug]`.

They may also appear in Xcode device logs or Metro logs for local builds.

## Implemented Mitigation

The mitigation is centralized in `src/components/Typography.tsx`.

When the app `Text` component receives direct Lingui `<Trans>` children, it now
resolves those translations through Lingui's `i18n._(...)` API before rendering
the native `Text` tree. This preserves existing `<Trans>` message IDs and rich
translation placeholders, but removes `TransNoContext -> Trans` from the native
text subtree that was crashing on iOS 26/TestFlight.

The mitigation intentionally does not rewrite call sites or globally replace
Lingui's `Trans` component. It only applies at the app text boundary where the
crash has been observed. It also leaves `<Trans>` with explicit `render` or
`component` props alone, because those sites own their render behavior.

## Better Logging Plan

For TestFlight-only freezes/watchdogs, `console.info` is not enough. A better
approach is a small redacted diagnostic ring buffer:

1. Write the last ~200 diagnostic events to local storage or a small file.
2. Redact credentials and PII.
3. Log low-volume state transitions, not every render.
4. On next app launch, detect that a previous session exited unclearly and upload
   the buffer to Sentry as context, breadcrumbs, an attachment, or a diagnostic
   message.

This would survive watchdog kills better than in-memory logs or TestFlight crash
reports.

High-value events to persist:

- report dialog opened
- report category selected
- report reason selected
- labeler list computed, with count and handles/DIDs
- labeler pressed
- submit step rendered
- submit pressed
- signup screen rendered by step
- signup service description loaded
- signup policies rendered, with TOS/privacy-link presence
- signup next pressed from info step
- handle availability check start/result/error
- account creation start/error/success

Do not persist:

- email values
- password values
- invite code values
- verification code values

## iOS 26 E2E Coverage

Current iOS 26 regression test coverage is synthetic and does not directly cover
these bugs.

Files:

- `src/screens/E2E/Ios26CrashRegressionScreen.e2e.tsx`
- `__e2e__/flows/ios26/crash-regression.yml`

Current test stresses:

- Yoga/layout mutation
- selectable text mount/unmount
- text input focus
- repeated layout changes

It does not cover:

- TestFlight/release build behavior
- signup `Policies`
- report dialog labeler selection
- watchdog after freeze
- Sentry/TestFlight crash delivery behavior

Additional targeted E2E coverage should be added after fixes or repro helpers
are stable.

## Root Cause Identified (2026-07-01)

The `RangeError: Maximum call stack size exceeded (native stack depth)` class
is not caused by Lingui `<Trans>` nesting inside app `<Text>`. It is an
infinite mutual recursion inside core-js's `Function.prototype.toString`
wrapper, triggered by Metro's `inlineRequires` in release bundles. The nested
Trans/Text sites were only where the error *surfaced*, because the recursion
fires from any `fn.toString()` call — including React's component-stack
generation during those renders.

### Mechanism

1. `@atproto/oauth-client-expo` (added with native OAuth, commit `bdcf45d8`)
   imports `core-js/proposals/explicit-resource-management` on native. This is
   the only thing that puts core-js in the app bundle — upstream Bluesky does
   not ship core-js, which is why upstream renders the identical Trans/Text
   patterns without crashing.
2. core-js's `internals/make-built-in.js` replaces
   `Function.prototype.toString` at module-body execution time. The wrapper
   falls back to `internals/inspect-source.js` for functions without core-js
   internal state.
3. `inspect-source.js` captures `Function.toString` at *its* module-body
   execution time. In a Metro release bundle, `inlineRequires` defers that
   execution to the first call of the wrapper — i.e. strictly *after* the
   wrap. It therefore captures the wrapper itself.
4. From then on, any `fn.toString()` on a non-core-js function recurses:
   wrapper → inspectSource → wrapper → … until Hermes hits its native stack
   guard. This matches Sentry `SOCIAL-APP-2`, whose stack repeats through
   core-js `Function.prototype.toString` helpers.
5. Known upstream reports: core-js issues #1237 and #1381 (React Native /
   Hermes, import-order dependent).

This explains every previously unexplained observation:

- Device/TestFlight-only: dev/simulator surfaces it as a LogBox warning caught
  by the ErrorBoundary (the `Maximum call stack size exceeded` LogBox ignore
  was added in `cc06d67f` — the very next commit after OAuth/core-js landed);
  release builds turn the unhandled rethrow into `RCTFatal`.
- Never reproduced in Jest or the E2E harness: the loop needs Metro
  `inlineRequires` plus a runtime `fn.toString()` call, not any particular
  component tree.
- "Crashes upon opening": OAuth session restore initializes core-js at launch
  for logged-in users.
- Build 14 still crashed on open after the UITextView clamp fix: the clamp
  addressed the separate native crash only.

### Verification

Reproduced deterministically in plain Node against the real core-js@3.49.0
files by emulating the inline-requires execution order (wrap first, lazy
inspect-source):

- unpatched: `RangeError: Maximum call stack size exceeded`
- with the re-entrancy guard patch: safe (no recursion)
- with inspect-source loaded before the wrap: fully correct native source
  returned

### Fix (this branch)

1. `index.js` eagerly imports `core-js/internals/inspect-source` before any
   core-js polyfill can wrap `Function.prototype.toString`, so the native
   `toString` is captured first and the shared `inspectSource` helper is
   permanently safe (`core-js` is now declared as a direct dependency for
   this import).
2. `patches/core-js@3.49.0.patch` adds a re-entrancy guard inside
   `inspect-source.js` as a backstop in case the import ever moves.

### Workarounds removed as obsolete

- The `Typography.tsx` `<Trans>` interception (`7aa4c03a6`) — reverted.
- `patches/@lingui+react+5.9.5.patch` — deleted (it was already unwired from
  `pnpm-workspace.yaml`).
- The `Maximum call stack size exceeded` LogBox ignore in `index.js` — removed
  so any regression is visible in dev again.

### Kept (separate, real native bug)

- `patches/react-native-uitextview@1.4.0.patch` (shadow-child index clamp):
  TestFlight feedback 10's `-[__NSArrayM insertObject:atIndex:]` crash in
  `RNUITextViewShadow.insertReactSubview` is a genuine react-native-uitextview
  index-skew bug, unrelated to core-js. A follow-up should replace the clamp
  with correct index mapping to avoid silently dropping/reordering text.
- `RichTransText` and its call-site migrations (functional improvements).

# Plan: Fix code-review findings for PR 11592 (session persistence rework)

Source: adversarial code review of PR 11592 (versioned localStorage sessions,
see `versioned-localstorage-sessions.md`). 16 deduped candidates, 2 refuted,
10 confirmed/plausible findings reported. This plan groups them into six
workstreams ordered by severity and shared root cause. No implementation has
started.

## Root-cause summary

The PR makes persistence writes awaited and failable where they were previously
fire-and-forget (`void persisted.write(...)`). Three systemic consequences fell
out of that change and account for most findings:

1. **Inconsistent failure handling at call sites.** Some paths swallow write
   failures silently, some rethrow into callers that treat any rejection as
   total failure, and none distinguish "server operation succeeded but
   persistence failed" from "operation failed."
2. **In-memory state (`_state`) is now only adopted after a successful write**,
   so a storage failure also corrupts the in-memory view - a regression vs
   main, where `_state` was updated before the (swallowed) write.
3. **Persistence now sits inside the awaited token-refresh chain**, so its
   locking behavior can block the request path.

## Findings-to-workstream map

| # | Finding (short) | File anchor | Workstream |
| - | --- | --- | - |
| 1 | writeToStorage rethrow breaks private mode | `src/state/persisted/index.web.ts:221` | A |
| 2 | Indefinite Web Lock can hang token refresh in all tabs | `src/state/persisted/storage-lock.web.ts:21` | B |
| 3 | Stale bundle's token rotation silently not persisted | `src/state/session/index.tsx:119` | C |
| 4 | Failed logout write can resurrect session on cold start | `src/state/session/index.tsx:449` | A |
| 5 | resumeSession no-op resolves as success | `src/state/session/index.tsx:532` | D |
| 6 | resumeSession rejects after switch already committed | `src/state/session/index.tsx:554` | A |
| 7 | Removed empty-page cursor HACKFIX | `src/lib/api/feed/likes.ts:52` | E |
| 8 | Background refresh reorders account list | `src/state/persisted/session-merge.ts:292` | D |
| 9 | try/finally rewrite can strand pending flags | `src/screens/Login/ChooseAccountForm.tsx:62` | F |
| 10 | refreshSession throws despite successful rotation | `src/state/session/index.tsx:688` | A |

## Workstream A: unify persistence-failure semantics (findings 1, 4, 6, 10)

This is the core of the fix. Decide on one policy and apply it everywhere,
rather than patching the four symptomatic sites independently.

### Proposed policy

- **In-memory state always commits first.** A storage write failure must never
  leave `_state` (or the session reducer) behind the truth. Restore the main
  behavior: update `_state` before attempting the write, on both platforms
  (`src/state/persisted/index.web.ts:104`, `src/state/persisted/index.ts:95-96`).
- **Persistence failures are reported, not thrown, on the session paths.**
  Callers of `login` / `createAccount` / `refreshSession` / `resumeSession` /
  `logout` should see success when the server-side operation succeeded. Storage
  failure becomes a logged warning (with a `safeMessage`) plus, where it
  matters, a one-time user-facing signal - not a rejection racing up into
  callers like `ChangeHandleDialog.tsx:176/331` and `Deactivated.tsx:77` that
  cannot distinguish the two.
- **Expected environmental failures stay quiet.** Web private mode /
  quota-exceeded is expected; restore the main-era swallow (with a debug log)
  in `writeToStorage` (`index.web.ts:216-221`) so ~25 fire-and-forget
  `persisted.write()` call sites (e.g. `src/state/preferences/languages.tsx:46`,
  `src/state/shell/onboarding.tsx:40`) do not each produce an unhandled
  rejection.

### Tasks

- [ ] Restore commit-before-write ordering for `_state` on web
      (`index.web.ts:104`) and native (`index.ts:95-96`). This alone fixes the
      "second language toggle loses the first" in-memory regression (finding 1)
      and the logout-resurrection vector (finding 4), since a later successful
      write of any key spreads `{..._state, [key]: value}` from a `_state` that
      already reflects the logout.
- [ ] Stop rethrowing from `writeToStorage` on web for quota/private-mode
      errors; keep rethrow (or structured error) only for unexpected failures.
- [ ] Sweep every `store.dispatch(...)` persistence promise in
      `src/state/session/index.tsx` (lines ~119-139, 371-375, 417-421, 449,
      498, 532-554, 688-693, 732) and make handling uniform per the policy
      above. Today: login/createAccount `.catch()` and continue,
      logout/removeAccount `.catch(() => {})` silently, resumeSession awaits
      uncaught, refreshSession rethrows via `takeSessionChangeError`. All four
      shapes should collapse to one helper, e.g.
      `persistOrWarn(promise, context)`.
- [ ] resumeSession (finding 6): the in-memory switch commits synchronously at
      `index.tsx:114-115`; the awaited write at `index.tsx:554` must not turn a
      committed switch into a caller-visible failure
      (`useAccountSwitcher.ts:49-57` currently shows "Please sign in as
      @handle" and routes to login while `hasSession` is already true).
- [ ] refreshSession (finding 10): once persistence failures no longer throw,
      confirm `ChangeHandleDialog` and `Deactivated` close/succeed correctly.
      If we decide some callers DO need to know about persistence failure,
      expose it as a discriminated result, not a rejection.
- [ ] Audit for remaining unhandled-rejection paths: every `persisted.write()`
      and session `dispatch` call site either awaits with handling or is
      explicitly `void`-ed against a non-throwing promise.

### Open decision

Whether logout should surface persistence failure to the user (it is the one
case where a swallowed failure has a security flavor: tokens remain on disk).
Options: (a) toast "couldn't fully clear stored credentials"; (b) retry harder
then give up silently once `_state` ordering is fixed (the resurrection bug is
gone either way); (c) queue a tombstone re-write on next successful write.
Recommend (b) plus a `logger.error` - the resurrection vector, not the disk
residue, was the real bug, and native disk-full is rare.

## Workstream B: bound the Web Lock so it cannot hang token refresh (finding 2)

`navigator.locks.request(PERSISTED_STORAGE_LOCK, op)` at
`storage-lock.web.ts:21` is exclusive, indefinite, and now sits inside the
awaited chain `fetchHandler -> refresh() -> onUpdated -> dispatch ->
writeSession` (`password-session.js:115-116`, `index.web.ts:121`). A tab paused
in devtools (or hung in the critical section) blocks token refresh - and with
it every authenticated request - in all other tabs.

### Tasks

- [ ] Add an `AbortSignal` timeout to the lock request (a few seconds). On
      timeout, proceed per Workstream A policy: in-memory state is already
      committed; log and skip (or retry once in the background) the persisted
      write. Never let the request path wait indefinitely on another tab.
- [ ] Alternatively/additionally: move the persisted write out of the awaited
      refresh chain entirely - resolve the session promise after the reducer
      dispatch, and let `writeSession` run fire-and-forget behind the lock.
      Evaluate against the cross-tab reconciliation logic before choosing;
      the write ordering guarantees in `session-merge.ts` may depend on
      awaiting.
- [ ] Add a regression test simulating a held lock: second tab's refresh must
      complete (in memory) within the timeout budget.

## Workstream C: persist successful rotations from stale bundles (finding 3)

The reducer's bundle-identity guard (`src/state/session/reducer.ts:84-90`)
returns state unchanged for a mutation from a superseded bundle, so
`needsPersist` stays false and `dispatch` never calls `writeSession`
(`index.tsx:119-139`). But the server has already rotated the refresh token;
bundle disposal is deferred to a post-commit effect (`index.tsx:887-899`), so
account A's `onUpdated` legitimately fires mid-switch. Storage keeps the
consumed refresh token; resuming A after the PDS grace period (~2h) logs the
user out.

### Tasks

- [ ] Decouple "update reducer state" from "persist credentials": a valid
      `refresh` mutation for a known account should reach storage (via the
      session-merge path, which already reconciles by account DID and
      generation) even when the reducer rejects it for bundle identity.
      Concretely: in `onSessionChange` / dispatch, if the reducer returns
      unchanged due to bundle mismatch but the mutation carries newer
      credentials for a stored account, still call `writeSession` with a
      credentials-only merge.
- [ ] Guard against the inverse: a rotation from a stale bundle must not
      clobber NEWER stored credentials for the same account - rely on the
      existing generation comparison in `session-merge.ts` (the "Log rejected
      refresh generations" commit suggests the machinery exists).
- [ ] Test: switch A -> B while A has an in-flight refresh; assert storage ends
      with A's rotated token, reducer stays on B.

## Workstream D: resumeSession divergence and account ordering (findings 5, 8)

### Finding 5: silent no-op resume

`if (!latestStoredAccount?.refreshJwt) return` at `index.tsx:532` resolves as
success without dispatching, so `useAccountSwitcher.ts:38-42` shows "Signed in
as @handle" and fires the `account:loggedIn` metric while the previous account
is still active.

- [ ] Make the no-credentials path throw a typed error (e.g.
      `SessionResumeError('no-stored-credentials')`) so the existing caller
      catch shows "Please sign in as @handle" and routes to login, matching
      main's behavior. Keep the early return only if there is a case where
      silent success is genuinely correct (none identified in review).

### Finding 8: background refresh reorders the account list

`replaceAccount` (`session-merge.ts:292`) unshifts to index 0 and is called by
both `refresh` (line 205) and `login` (line 238) mutations. Cross-tab sync
adopts the order verbatim (`reducer.ts:238-241`), so `AccountList.tsx:54`
reorders under the user's finger during a background refresh in another tab.

- [ ] Preserve list position for `refresh` mutations (replace in place);
      move-to-front only for explicit user actions (login, switch). If
      "current account first" is an invariant elsewhere, derive display order
      in the UI instead of mutating storage order.
- [ ] Test: refresh mutation for account at index 2 leaves it at index 2;
      login mutation still fronts it.

## Workstream E: restore empty-page cursor protection in feed APIs (finding 7)

The removed HACKFIX ("-sfn" comment) in `src/lib/api/feed/likes.ts:52` and
`src/lib/api/feed/custom.ts:99` handled servers returning a cursor with zero
items. The PR's `seenCursors` guard exists only in `MergeFeedAPI`
(`merge.ts:226-236`). `useAutoPagination`'s repeated-cursor guard never matches
an advancing cursor and its 50-attempt failsafe resets whenever `itemCount`
changes; afterward `hasNextPage` stays true and every `onEndReached` refetches
empty pages with a flashing spinner (`PostFeed.tsx:773, 964`).

- [ ] Either restore the empty-page-drops-cursor behavior in `LikesFeedAPI`
      and `CustomFeedAPI`, or lift the `seenCursors` guard into shared code all
      feed APIs use. Prefer the shared guard - it also covers future APIs.
- [ ] Test: mock a feed returning `{items: [], cursor: <advancing>}` pages;
      assert pagination terminates and `hasNextPage` goes false.

## Workstream F: restore finally-guaranteed cleanup (finding 9)

The systematic `try/finally` -> `try/catch` + trailing-statement rewrite (~14
sites) skips cleanup when the catch body itself throws. Confirmed sites:

- `src/screens/Login/ChooseAccountForm.tsx:62` - `setPendingDid(null)` skipped
  if `onSelectAccount(account)` (line 60) throws; the `if (pendingDid) return`
  guard (line 33) then ignores every tap until remount.
- `App.tsx:130` - `setIsReady` skipped -> stuck splash screen.
- `ChangePasswordDialog`, `ExportCarDialog`, `ReportDialog`,
  `useAccountSwitcher` - `setIsProcessing`/`setLoading` flags, with
  `Toast.show` in the catch as the potential thrower.

### Tasks

- [ ] Enumerate all rewritten sites in the PR diff (search the diff for removed
      `finally` blocks) and restore `finally` for every state-flag cleanup.
      Keep `catch` for the error handling; this is `try/catch/finally`, not a
      revert.
- [ ] If any site intentionally moved cleanup out of `finally` (e.g. cleanup
      must NOT run on failure), add a comment stating why.

## Sequencing

1. **A first** - it defines the failure-semantics policy the other session
   workstreams build on, and fixes the two worst user-facing regressions
   (private-mode breakage, logout resurrection).
2. **B and C next** - both touch the dispatch/writeSession chain A refactors;
   doing them after A avoids rework. B's "move write off the refresh chain"
   option interacts with A's helper.
3. **D** after A (finding 5's fix shape depends on A's error-vs-result
   decision for resumeSession).
4. **E and F** are independent of A-D and of each other; can be parallelized
   or done in separate small PRs at any point.

## Verification

- [ ] `pnpm test`, `pnpm typecheck`, `pnpm lint` clean.
- [ ] New unit tests called out in B, C, D, E above.
- [ ] Manual web pass in Safari private mode: toggle preferences (no unhandled
      rejections, both of two consecutive language additions stick), log in,
      change handle (dialog closes), switch accounts, log out.
- [ ] Manual two-tab pass: background refresh in tab B while tab A has the
      account switcher open (no reorder); pause tab B in devtools and confirm
      tab A's requests still complete after token expiry.
- [ ] Native smoke: login, switch, logout, relaunch (no session resurrection).

## Explicitly out of scope (cut or refuted in review)

- uriSize.web helper claim - refuted (blob URLs, not data URIs).
- No-Web-Locks fallback - documented accepted tradeoff.
- Cleanup-level items cut under the finding cap: duplicated reconciliation
  blocks, writeSession fast-path/full-root round-trip, storage-lock
  duplication, `persistWithRetry` vs `retry()`, `messages.po` churn. Revisit
  in a follow-up `/simplify` pass after the correctness fixes land.
- Native `readLatest` lagging the write queue during rapid account switches -
  weakest plausible race, mitigated by the PDS grace period; not planned.

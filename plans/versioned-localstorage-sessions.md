# Versioned, localStorage-Authoritative Sessions

## Background: refresh generations and the two-hour grace period

The PDS rotates refresh tokens. When refresh token `A` is first used, the server creates a successor identified by `B` and limits `A`'s remaining server-side lifetime to two hours:

```text
A (jti=a) -> B (jti=b)
```

During that two-hour grace period, another request using `A` does not create a competing successor. It converges on the existing successor `B`:

```text
First use of A:       A -> B  (jti=b)
Concurrent retry:     A -> B' (jti=b)
Delayed retry:        A -> B'' (jti=b)
```

`B`, `B'`, and `B''` may be different serialized JWTs with different `iat` or `exp` values, but their shared `jti=b` means they are aliases of the same **token generation**. A generation is the server-side refresh-token identity and position in the rotation lineage, not one particular serialized JWT:

```text
Generation A -> Generation B -> Generation C
```

A bounded refresh-token reuse or grace window is a common solution to refresh-token rotation races in distributed clients. It allows ordinary duplicate requests, retries after a network timeout, simultaneous refreshes, and separate processes holding the same session to succeed without forking the token lineage or unexpectedly logging the user out.

The grace period is fixed. Reusing `A` does not extend it. After two hours, `A` is no longer accepted even though a JWT minted for `A` may have a later nominal expiration. An `ExpiredToken` response for `A` therefore establishes only that generation `A` is no longer valid; it does not establish that a newer generation such as `B` does not exist in shared client storage.

This distinction is the basis of the client-side plan below.

## Goal

Prevent a stale browser tab from overwriting or expiring a newer shared credential generation.

The central invariant is:

> A tab may only modify the credential generation it actually observed, and a stale failure must never invalidate a newer shared generation.

## 1. Model refresh tokens as generations

A refresh token's `jti` identifies its server-side generation. Represent an account's current credential state as:

```text
(version, refresh jti)
```

For example:

```text
(7, A) -> refresh -> (8, B) -> refresh -> (9, C)
```

Concurrent refreshes of `A` converge on the same next `jti`:

```text
Tab A: (7, A) -> (8, B)
Tab B: (7, A) -> (8, B')
```

`B` and `B'` may be different serialized JWTs with different `iat` or `exp` values, but both have `jti = B`. They are aliases of the same server-side generation.

Therefore:

- Use the refresh JWT's `jti` for generation identity.
- Use a locally persisted monotonic version for sequencing and tombstone ordering.
- Do not use JWT `iat` as the generation.

The persisted `(credentialVersion, refreshJti)` pair describes the credential state, but conditional commits do not compare both fields as a CAS key. They establish eligibility from the current status and the `jti` of the refresh token the operation actually used. If that generation is still active, the accepted mutation writes the next local version.

A persisted credential could look like:

```ts
type PersistedCredential = {
  credentialVersion: number
  refreshJti?: string
  accessJwt?: string
  refreshJwt?: string
  status: 'active' | 'logged-out'
}
```

`credentialVersion` advances when an accepted mutation establishes a new credential-ordering boundary: a new refresh `jti`, login, expiration, logout, or removal. Repeating an explicit logout advances the tombstone even if the account is already logged out. Concurrent refresh responses with the same successor `jti` keep the existing version. Metadata changes, account ordering, and current-account selection do not advance it.

## 2. Make localStorage authoritative

localStorage is the shared cross-tab session authority. A tab's in-memory session is only a working copy. For example:

```text
Tab A memory:       (8, B)
Tab B memory:       (7, A)  <- stale
Shared localStorage: (8, B)  <- authoritative
```

The app does not preflight localStorage before every authenticated request. A request already queued by a frozen tab may leave with a stale access token and trigger an automatic refresh before queued update notifications are processed. That is acceptable as long as the refresh result or expiration cannot mutate shared state without reconciliation.

Every tab must synchronously read localStorage:

- before explicitly resuming a persisted session;
- before committing refreshed credentials;
- before treating `ExpiredToken` as a logout; and
- when notified that another tab updated the session.

If a queued stale refresh succeeds, its result is conditionally committed against the generation it used. If it expires, the expiration handler reads localStorage and adopts a healthy newer generation. The original queued request may fail, but subsequent requests use the rebuilt latest session. Correctness does not depend on processing a broadcast before the queued request.

Tabs must not publish complete in-memory session snapshots as authoritative state. Metadata updates should patch metadata onto a fresh localStorage read without touching credential fields.

Current-account selection is also explicit mutation intent, not a field inferred from an otherwise stale session snapshot. A commit preserves the current account read from localStorage unless the operation explicitly switches accounts. Login, account creation, and explicit resume/switch operations may select their target DID. Refreshes and metadata updates do not change the persisted selection. Logout, removal, and expiration begin from the persisted selection; the final credential-state validation clears it only if that selected account is no longer active.

For example:

```text
Tab A commits:       current account Y
Tab B stale memory:  current account X
Tab B updates:       metadata or refreshed credentials for X
Tab B rereads:       current account Y
Tab B commits:       preserve current account Y
```

## 3. Commit refreshes conditionally

Start with both tabs and shared storage at the same credential generation:

```text
Tab A memory:        (7, A)
Tab B memory:        (7, A)
Shared localStorage: (7, A)
```

Tab A captures refresh generation `A` from the session performing the request. An explicit resume first rereads localStorage; an automatic refresh may begin from the live in-memory bundle before a queued update notification is processed:

```text
Tab A base: generation A
Tab A sends refresh token A to the PDS
Tab A receives successor generation B
```

Before committing the response, `writeSession()` acquires the persisted-storage lock and synchronously rereads localStorage. The source of truth may have changed while the network request was in flight.

### Case 1: nothing else changed

```text
Tab A base:          (7, A)
Shared localStorage: (7, A)
Tab A result:        generation B

Tab A commits:       (8, B)
```

### Case 2: Tab B committed the same convergent generation

```text
Tab A base:          (7, A)
Tab B refreshes:     (7, A) -> (8, B')
Shared localStorage: (8, B')
Tab A result:        generation B
```

`B` and `B'` have the same `jti`, so they are aliases of the same server-side generation. Tab A keeps or merges the localStorage value as version 8. It must not advance it to version 9.

### Case 3: Tab B advanced or cleared the session

```text
Tab A base:          (7, A)
Tab B commits:       (8, B), (9, C), or a logout tombstone
Shared localStorage: newer than Tab A's base
Tab A result:        based on stale generation A

Tab A action:        do not overwrite localStorage
```

Commit eligibility is generation-specific: the current persisted credential must still be `active` and its `refreshJti` must match the base refresh token's `jti`. `credentialVersion` records the accepted ordering but is not itself part of this comparison.

This makes concurrent refreshes harmless while preventing a suspended Tab A from rolling back state already advanced by Tab B.

## 4. Make expiration generation-specific

`ExpiredToken` establishes only that the presented refresh-token generation is invalid. It does not establish that the account's latest shared session is invalid.

If Tab B fails while refreshing `(7, A)`, it synchronously rereads localStorage before changing shared state:

```text
Tab B attempted:     (7, A)
Shared localStorage: (7, A)

Tab B action:        expire generation A
```

If Tab A has already advanced the shared session, the same failure is stale:

```text
Tab A refreshes:     (7, A) -> (8, B)
Tab A writes:        (8, B) to shared localStorage

Tab B wakes later with stale in-memory state: (7, A)
Tab B attempts A:    ExpiredToken
Tab B reads:         (8, B) from shared localStorage
Tab B action:        adopt B instead of logging out
```

The stale failure is local archaeology, not an authoritative global logout.

## 5. Version logout and removal

Explicit logout should create a newer credential tombstone:

```text
Shared localStorage: (8, B, active)
Tab A starts refresh using (8, B)
Tab B logs out and writes (9, empty, logged-out)
Tab A receives a refresh result based on (8, B)
Tab A rereads localStorage and preserves Tab B's version 9 tombstone
```

That prevents Tab A's delayed refresh from resurrecting credentials after Tab B's explicit logout. Each accepted explicit logout advances the tombstone, including a repeated logout of an already logged-out account.

Account removal must create a versioned removal tombstone. Stale tabs preserve that tombstone rather than restoring the removed account. An explicit fresh login is the one operation allowed to resurrect it: the login advances the version and replaces the removal tombstone with active credentials.

```text
Shared localStorage: (9, empty, removed)
Tab A stale write:   based on (8, B) -> preserve version 9 tombstone
Tab B fresh login:   version 9 tombstone -> (10, C, active)
```

## 6. Broadcast only after committed writes

A localStorage write must report success or throw. Never update the persisted in-memory cache or broadcast an update notification when the durable write failed.

```text
Tab A memory:        (8, B)
Tab A write:         fails
Shared localStorage: (7, A)
Tab A action:        report or retry; do not broadcast

Tab A retry:         succeeds
Shared localStorage: (8, B)
Tab A action:        broadcast update notification
```

Broadcasting after a failed write would tell Tab B to reread localStorage while it still contains `(7, A)`, spreading the stale generation instead of the new one.

Login, account creation, and partial session metadata refresh use a success-with-warning policy once their reducer state has committed. If persistence then fails, the method logs a warning with the error and resolves successfully instead of reporting that the already-completed login or account creation failed. The in-memory session remains usable, but may not survive a reload. The underlying write still throws, and the persisted cache and other tabs are not updated.

### Edge case: a failed write leaves a missing lineage link

If the process survives a failed write, its live `PasswordSession` may advance while authoritative storage remains behind:

```text
t0 memory/storage:   generation A
t1 server refresh:   A -> B
t1 reducer/session:  generation B
t1 storage write:    fails; localStorage remains A

t2 server refresh:   B -> C
t2 conditional write:
  base generation:   B
  localStorage:      A
  action:            reject C because the persisted base is not B
```

The committed reconciliation then rebuilds the live session from persisted generation `A`, discarding the valid in-memory generation `C`. If `A` is still inside the PDS reuse window, subsequent refreshes can walk back through the server lineage and recover, potentially requiring extra round trips. If `A`'s fixed grace period has expired, the account may be logged out.

This is a deliberate safety tradeoff. The conditional merge cannot prove that the missing `A -> B` write belonged to this process; the in-memory `B` could instead be stale credentials from another tab or an older login lineage. Accepting `B -> C` without a persisted `B` would weaken the central invariant and could overwrite a different authoritative session. The implementation therefore prefers the persisted generation even though an isolated failed write can turn a healthy in-memory session into a later logout.

A rejected refresh result emits a diagnostic log when its result generation also differs from the persisted generation. Expected convergent aliases, where the rejected result already matches persisted storage, do not log. The diagnostic includes only the persisted credential version and status, never JWTs or token `jti` values.

A retry of the original `A -> B` write before another refresh closes the gap. Native retries the same queued root snapshot once. Web reports the storage failure without updating its persisted cache or broadcasting; automatic refresh paths log the failure, while explicit refresh operations report it to their caller.

* * *

After successfully writing localStorage, notify other tabs:

```ts
broadcast.postMessage({
  event: {
    type: 'BSKY_UPDATE',
    key: 'session',
  },
})
```

The message is a hint, not state. For example:

```text
Tab A writes:        (8, B) to shared localStorage
Tab A broadcasts:    "persisted session state updated"
Tab B receives:      the update notification
Tab B reads:         (8, B) from shared localStorage
Tab B adopts:        (8, B)
```

Tab B must not adopt credentials carried by the message itself. If Tab B misses or receives the broadcast late, its next credential operation still rereads localStorage before acting.

Use the app's existing `BroadcastChannel` to notify other tabs after a committed update. It is an explicit, named channel with a typed message identifying the persisted key that changed, and the app already has the necessary wiring. Write localStorage before posting the message so every receiver can immediately read the committed state.

The notification is not authoritative; localStorage remains the source of truth.

## 7. Use Web Locks as the final coordination layer

Monotonic versions detect stale work, but localStorage read-modify-write is not atomic:

```text
Tab A reads:  version 8
Tab B reads:  version 8
Tab A plans:  write version 9
Tab B plans:  write version 9
```

Network refreshes do not run while holding a Web Lock. A refresh captures the generation it uses and performs the network request first. The resulting session mutation is then passed to `writeSession()`, which owns the lock around reconciliation and persistence:

```text
Capture refresh generation A
Perform network refresh A -> B
Call writeSession with base A and result B
writeSession acquires the persisted-storage lock
writeSession rereads, conditionally merges, and persists
```

This avoids holding a cross-tab lock over network I/O. Multiple refresh requests may be in flight concurrently; server-side convergence and the generation-specific conditional commit make their results safe.

All persisted values share one localStorage blob, so every write uses the same persisted-storage lock. This includes successful refresh reconciliation, expiration, logout, account removal, login replacement, and unrelated preference writes. One root lock is sufficient: it serializes the complete read-modify-write operation, so nesting per-account locks would add no coordination.

Feature-detect the Web Locks API. If `navigator.locks.request` is unavailable, run the operation without a lock rather than failing startup or session operations. Generation-specific conditional commits still reject stale work in this fallback mode, but localStorage read-modify-write is not fully serialized across tabs.

If Tab A holds the lock, Tab B waits. Once Tab A writes and releases it, Tab B acquires it and rereads Tab A's new localStorage state before deciding what to commit.

The complete refresh flow is:

```text
Capture base refresh jti
   |
   v
Perform network refresh without a lock
   |
   v
Acquire persisted-storage Web Lock
   |
   v
Read authoritative localStorage state
   |
   v
Conditionally commit against active base jti
   |
   v
Write localStorage
   |
   +-- failure -> report or retry; do not broadcast
   |
   v
Broadcast update notification
   |
   v
Other tabs reread localStorage
```

## Unavoidable residual case

No client-side coordinator can completely protect this sequence:

```text
t0:       Client durably stores (7, A)
t1:       Server accepts refresh A -> B
t1 + ms:  Client dies before persisting B
t1 + 2h:  A's server-side reuse grace period expires
t1 + 3h:  Client relaunches with A, which the server rejects
```

If the client returns within the grace period, reusing `A` converges on generation `B` and recovers. After the grace period, there is no newer client-side generation to adopt. This is a narrow crash-between-server-commit-and-client-persistence window, distinct from the stale-tab problem addressed by this plan.

## Native

Native does not have the web's multiple-session-holder race. The iOS notification service and share extensions do not load session state or refresh credentials, and Android has no equivalent authenticated background process. Native session data has a single in-memory owner and lives in the main app's private AsyncStorage.

Native does retain the unavoidable persistence window described above:

```text
Main app refreshes:  (7, A) -> (8, B)
Server commits:      B
App dies before:     AsyncStorage persists B
Next launch reads:   (7, A)
```

No client can make the server rotation and local AsyncStorage write atomic. The PDS's two-hour grace period is the primary recovery mechanism: reopening within it lets A converge on B; reopening after it may require the user to log in again.

Partial client-side mitigations can narrow the window and handle ordinary storage failures:

- Schedule persistence as the first action after receiving B, before unrelated work.
- Track the persistence promise for B and await it before an explicit refresh operation reports success.
- Propagate AsyncStorage failures instead of swallowing them.
- Retry the same enqueued root-state snapshot once before propagating the storage failure.

These measures improve durability during normal execution but cannot protect the interval in which the OS terminates the process after the server commits B and before the storage write completes.

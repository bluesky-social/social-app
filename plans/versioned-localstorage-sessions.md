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
- Use a locally persisted monotonic version for generation ordering.
- Do not use JWT `iat` as the generation.

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

`credentialVersion` should advance only when credential state changes. Metadata changes, account ordering, and current-account selection are not credential generations.

## 2. Make localStorage authoritative

localStorage is the shared cross-tab session authority. A tab's in-memory session is only a working copy. For example:

```text
Tab A memory:       (8, B)
Tab B memory:       (7, A)  <- stale
Shared localStorage: (8, B)  <- authoritative
```

Before Tab B uses its in-memory token, it must read localStorage and adopt `(8, B)`.

Every tab must synchronously read localStorage:

- before using a refresh token;
- before writing refreshed credentials;
- before treating `ExpiredToken` as a logout; and
- when notified that another tab updated the session.

Tabs must not publish complete in-memory session snapshots as authoritative state. Metadata updates should patch metadata onto a fresh localStorage read without touching credential fields.

## 3. Commit refreshes conditionally

Start with both tabs and shared storage at the same credential generation:

```text
Tab A memory:        (7, A)
Tab B memory:        (7, A)
Shared localStorage: (7, A)
```

Tab A synchronously reads `(7, A)` from localStorage and captures it as the base generation for its refresh:

```text
Tab A base: (7, A)
Tab A sends refresh token A to the PDS
Tab A receives successor generation B
```

Before committing the response, Tab A synchronously rereads localStorage. The source of truth may have changed while its network request was in flight.

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

That prevents Tab A's delayed refresh from resurrecting credentials after Tab B's explicit logout.

Account removal must create a versioned removal tombstone. Stale tabs preserve that tombstone rather than restoring the removed account. An explicit fresh login is the one operation allowed to resurrect it: the login advances the version and replaces the removal tombstone with active credentials.

```text
Shared localStorage: (9, empty, removed)
Tab A stale write:   based on (8, B) -> preserve version 9 tombstone
Tab B fresh login:   version 9 tombstone -> (10, C, active)
```

## 6. Use broadcasts only as invalidations

After synchronously writing localStorage, notify other tabs:

```ts
broadcast.postMessage({
  type: 'session-updated',
  did,
  credentialVersion: 8,
})
```

The message is a hint, not state. For example:

```text
Tab A writes:        (8, B) to shared localStorage
Tab A broadcasts:    "session updated for this account"
Tab B receives:      the invalidation hint
Tab B reads:         (8, B) from shared localStorage
Tab B adopts:        (8, B)
```

Tab B must not adopt credentials carried by the message itself. If Tab B misses or receives the broadcast late, its next credential operation still rereads localStorage before acting.

Use the app's existing `BroadcastChannel` as the primary invalidation mechanism. It is an explicit, named channel with a typed message that clearly expresses which account changed, and the app already has the necessary wiring. Write localStorage before posting the message so every receiver can immediately read the committed state.

The notification is not authoritative; localStorage remains the source of truth.

## 7. Use Web Locks as the final coordination layer

Monotonic versions detect stale work, but localStorage read-modify-write is not atomic:

```text
Tab A reads:  version 8
Tab B reads:  version 8
Tab A plans:  write version 9
Tab B plans:  write version 9
```

Use a per-account Web Lock to serialize credential operations across cooperating tabs:

```ts
await navigator.locks.request(`bsky-session:${did}`, async () => {
  const latest = readAccountFromLocalStorage(did)
  // Adopt latest, refresh or mutate it, then synchronously persist the result.
})
```

If Tab A holds the lock, Tab B waits. Once Tab A writes and releases it, Tab B acquires the lock and rereads Tab A's new localStorage state before deciding what to do.

All credential-changing operations should use the same lock:

- refresh;
- expiration;
- logout;
- account removal; and
- login replacing an existing account.

The complete flow is:

```text
Web Lock
   |
   v
Read authoritative localStorage state
   |
   v
Operate against captured (version, jti)
   |
   v
Reread and conditionally commit
   |
   v
Write localStorage synchronously
   |
   v
Broadcast invalidation
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
- Retry a failed write with the latest in-memory session snapshot while the process is still alive.

These measures improve durability during normal execution but cannot protect the interval in which the OS terminates the process after the server commits B and before the storage write completes.

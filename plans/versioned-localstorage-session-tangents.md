# Versioned localStorage session tangents

Deferred follow-up investigations from the review of `plans/versioned-localstorage-sessions.md`. These are not requirements of the current implementation unless promoted into the main plan.

## 1. Explicit metadata patches

### Problem

`applySessionUpdate()` starts from the latest persisted session, but currently lets every account in the incoming reducer snapshot replace persisted noncredential fields. A tab that has not processed a recent update notification can therefore regress newer account metadata during an otherwise unrelated session write.

Potentially affected fields include:

- `handle`;
- `email`;
- `emailConfirmed`;
- `emailAuthFactor`;
- `signupQueued`;
- `active`;
- `status`;
- `pdsUrl`; and
- `isSelfHosted`.

Credential fields are separately protected, so this does not attach tokens to the wrong DID or roll back an accepted credential generation.

```text
Shared metadata:     emailConfirmed=false
Tab A fetches:       emailConfirmed=true
Tab A commits:       emailConfirmed=true
Tab B stale memory:  emailConfirmed=false
Tab B writes:        an unrelated session change
Shared metadata:     emailConfirmed=false
```

### Possible direction

Stop treating the complete incoming account array as metadata intent:

1. Start from the accounts read from persisted storage.
2. Let accepted login and refresh credential mutations update their specific account from the server result.
3. Add an explicit metadata patch for `partial-refresh-session`, initially limited to `emailConfirmed` and `emailAuthFactor`.
4. Preserve persisted metadata during logout, removal, expiration, and unrelated account operations.
5. Apply neither credentials nor metadata from a rejected stale refresh.

This would implement the main plan's requirement that metadata updates patch a fresh storage read rather than publish a complete stale snapshot.

## 2. Lost updates without Web Locks

### Problem

When `navigator.locks.request` is unavailable, `runWithPersistedStorageLock()` runs its operation without cross-tab serialization. Generation-specific refresh and expiration checks still reject stale credential results, but an unrelated whole-root write has no equivalent guard.

```text
Tab A reads:         root state containing active account X
Tab B logs out X:    writes a newer logout tombstone
Tab A writes:        an unrelated preference using its older root snapshot
Result:              Tab A can overwrite the tombstone with active X
```

This is not introduced by the single-root-lock simplification; the previous lock wrapper had the same fallback. It is currently an explicit compatibility tradeoff for browsers without Web Locks.

### Assessment

The fallback is reachable within the production Browserslist target. `package.json` currently resolves as far back as iOS Safari 11.0-11.2, while MDN browser compatibility data records Web Locks support beginning in Chrome 69, Firefox 96, and Safari/iOS Safari 15.4.

The vulnerable window is narrow. Network refreshes happen before lock acquisition, and the fallback's authoritative read, merge, serialization, and localStorage write contain no `await`. A lost update therefore requires separate browser processes to execute overlapping synchronous commit sequences. It is still a real race: localStorage makes each individual operation atomic, not the complete read-modify-write sequence.

No simple fallback provides the same guarantee:

- a read-after-write check does not make the sequence atomic;
- a hand-rolled localStorage mutex introduces stale-owner and crash-recovery problems;
- failing closed would make otherwise usable single-tab sessions unable to persist token rotation; and
- an IndexedDB transaction coordinator or storage migration would be a substantially larger design.

### Decision

No action. This whole-root localStorage read-modify-write race predates the versioned-session work. The new Web Lock removes it for supporting browsers; the fallback preserves the pre-existing behavior for older browsers rather than making otherwise usable single-tab sessions fail. Eliminating the residual risk cleanly would require either raising the supported browser baseline to Web Locks or moving the shared root state to a transactional store.

Compatibility reference: [MDN `Navigator.locks`](https://developer.mozilla.org/docs/Web/API/Navigator/locks).

## 3. Keep lock ownership inside persistence

### Problem

`writeSession()` previously relied on every caller to enter the persisted-storage lock before dispatching a session action. The lock ownership was transitive and invisible at the write API, so a future direct caller could silently bypass serialization.

### Resolution

`writeSession()` now owns the persisted-storage lock on web. Its lock callback contains exactly the shared-state commit:

1. read the authoritative root from localStorage;
2. conditionally merge the session mutation;
3. write the updated root; and
4. broadcast the committed update.

Session callsites no longer acquire the lock. Network requests, reducer work, expiry rescue, and local bundle reconciliation remain outside it. Native retains its existing serialized AsyncStorage queue inside `writeSession()`.

This makes every call to `writeSession()` safe by construction, avoids non-reentrant nested Web Locks, and keeps the lock scoped to the operation that actually needs cross-tab exclusion.

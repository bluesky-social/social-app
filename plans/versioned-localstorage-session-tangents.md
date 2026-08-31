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

### Possible direction

Before changing the implementation:

1. Confirm which supported browsers can actually reach this fallback.
2. Decide whether using the app without cross-tab serialization is acceptable there.
3. If it is not acceptable, evaluate a different storage layout or coordinator. A read-after-write check does not make a localStorage read-modify-write atomic, and a hand-rolled localStorage mutex would add its own stale-lock and crash-recovery failure modes.

## 3. Enforce the session lock invariant

### Problem

`writeSession()` performs the conditional session read-modify-write but does not acquire the persisted-storage lock itself. Current session persistence callsites run it inside `runWithCredentialLock()`, which aliases the root storage lock, but this is a convention rather than an enforced API invariant.

The lock cannot simply be added inside `writeSession()` while callers retain the outer lock because Web Locks are not reentrant. A nested request for the same exclusive lock would deadlock.

A future caller could accidentally do this:

```ts
await persisted.writeSession({
  nextSession,
  credentialMutations,
})
```

without first entering the root lock.

### Possible direction

Potential enforcement options include:

1. Add a development assertion tracking whether the current realm is inside `runWithPersistedStorageLock()`.
2. Expose the unlocked commit only through a capability passed to the lock callback.
3. Move lock ownership into a higher-level session transaction API that performs the authoritative read, reconciliation, and write together.

Any enforcement should preserve the existing requirement that network refreshes happen outside the lock.

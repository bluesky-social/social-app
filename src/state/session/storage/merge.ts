import {
  type SessionAccount,
  sessionAccountSchema,
  type SessionSnapshot,
  sessionSnapshotSchema,
} from './schema'

/**
 * Three-way merge of session snapshots for cross-tab coherence on web.
 *
 * `base` is what this tab last read or wrote, `ours` is what it now wants to
 * write, and `theirs` is what storage holds right now (possibly changed by
 * another tab). The result folds our intended change onto the latest stored
 * state so concurrent tabs converge without losing each other's edits.
 *
 * Rules:
 * - An account we removed (in base, not in ours) is dropped even if theirs
 *   still has it.
 * - An account theirs removed wins that removal, whether or not we edited it -
 *   removal beats edit, and we never re-add an account another tab deleted.
 * - An account we did not touch takes theirs' version entirely.
 * - An account we changed keeps theirs' fields except the specific fields we
 *   changed (base to ours differ). Exception: for refreshJwt/accessJwt, if we
 *   changed the field but theirs also changed it to empty (a revocation), the
 *   revocation wins - we never resurrect tokens another tab dropped.
 * - An account we added (not in base) merges as {...theirs, ...ours} when
 *   theirs also has it, but each credential survives only if BOTH sides hold
 *   it (we cannot tell a fresh login from a stale re-add). When theirs lacks
 *   it we take ours as-is.
 * - Ordering: if we reordered accounts, use our order and append theirs-only
 *   dids; otherwise use theirs' order and append ours-only dids.
 * - currentDid is ours when we changed it, else theirs, and is cleared if it
 *   is not in the result.
 */
export function mergeSnapshots(
  base: SessionSnapshot,
  ours: SessionSnapshot,
  theirs: SessionSnapshot,
): SessionSnapshot {
  const baseByDid = new Map(
    base.accounts.map(account => [account.did, account]),
  )
  const oursByDid = new Map(
    ours.accounts.map(account => [account.did, account]),
  )
  const resultByDid = new Map(
    theirs.accounts.map(account => [account.did, account]),
  )

  // Accounts we removed drop out even if theirs still holds them.
  for (const did of baseByDid.keys()) {
    if (!oursByDid.has(did)) resultByDid.delete(did)
  }

  for (const account of ours.accounts) {
    const prior = baseByDid.get(account.did)
    if (!prior) {
      resultByDid.set(account.did, mergeAddedAccount(account, resultByDid))
      continue
    }
    if (JSON.stringify(prior) === JSON.stringify(account)) {
      // We did not touch this account; theirs' version wins entirely.
      continue
    }
    const theirsAccount = resultByDid.get(account.did)
    if (!theirsAccount) {
      // Their removal wins over our edit.
      continue
    }
    resultByDid.set(
      account.did,
      sessionAccountSchema.parse(
        mergeChangedAccount(prior, account, theirsAccount),
      ),
    )
  }

  const order = mergeOrder(base, ours, theirs, resultByDid)
  const accounts = order.flatMap(did => {
    const account = resultByDid.get(did)
    return account ? [account] : []
  })

  let currentDid =
    base.currentDid === ours.currentDid ? theirs.currentDid : ours.currentDid
  if (currentDid && !resultByDid.has(currentDid)) currentDid = undefined

  return sessionSnapshotSchema.parse({accounts, currentDid})
}

/**
 * Merge an account we added onto whatever another tab may already hold under
 * the same did. Credentials survive only when both sides have them.
 */
function mergeAddedAccount(
  account: SessionAccount,
  resultByDid: Map<string, SessionAccount>,
): SessionAccount {
  const theirsAccount = resultByDid.get(account.did)
  if (!theirsAccount) {
    return sessionAccountSchema.parse(account)
  }
  return sessionAccountSchema.parse({
    ...theirsAccount,
    ...account,
    refreshJwt:
      theirsAccount.refreshJwt && account.refreshJwt
        ? account.refreshJwt
        : undefined,
    accessJwt:
      theirsAccount.accessJwt && account.accessJwt
        ? account.accessJwt
        : undefined,
  })
}

/**
 * Overlay the fields we changed (base to ours) onto theirs' version. A
 * credential we changed is not applied if theirs revoked it to empty.
 */
function mergeChangedAccount(
  base: SessionAccount,
  ours: SessionAccount,
  theirs: SessionAccount,
): SessionAccount {
  const merged: SessionAccount = {...theirs}
  for (const key of changedKeys(base, ours)) {
    if (key === 'refreshJwt' || key === 'accessJwt') {
      const theirsRevoked = theirs[key] !== base[key] && !theirs[key]
      if (theirsRevoked) continue
    }
    ;(merged as Record<string, unknown>)[key] = ours[key]
  }
  return merged
}

/** Keys whose value differs between two accounts. */
function changedKeys(
  base: SessionAccount,
  ours: SessionAccount,
): (keyof SessionAccount)[] {
  const keys = new Set<keyof SessionAccount>([
    ...(Object.keys(base) as (keyof SessionAccount)[]),
    ...(Object.keys(ours) as (keyof SessionAccount)[]),
  ])
  return [...keys].filter(key => base[key] !== ours[key])
}

function mergeOrder(
  base: SessionSnapshot,
  ours: SessionSnapshot,
  theirs: SessionSnapshot,
  resultByDid: Map<string, SessionAccount>,
): string[] {
  const baseOrder = base.accounts.map(account => account.did)
  const oursOrder = ours.accounts.map(account => account.did)
  const theirsOrder = theirs.accounts.map(account => account.did)
  const oursDids = new Set(oursOrder)
  const theirsDids = new Set(theirsOrder)
  const reordered = JSON.stringify(baseOrder) !== JSON.stringify(oursOrder)
  const order = reordered
    ? [...oursOrder, ...theirsOrder.filter(did => !oursDids.has(did))]
    : [...theirsOrder, ...oursOrder.filter(did => !theirsDids.has(did))]
  return order.filter(did => resultByDid.has(did))
}

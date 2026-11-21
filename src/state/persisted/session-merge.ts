import {jwtDecode} from 'jwt-decode'

import {logger} from '#/logger'
import {
  type PersistedAccount,
  type PersistedCredentialState,
  type Schema,
} from './schema'

export type SessionCredentialMutation =
  | {
      type: 'refresh'
      accountDid: string
      baseRefreshJwt: string | undefined
      resultRefreshJwt: string | undefined
    }
  | {
      type: 'expire'
      accountDid: string
      baseRefreshJwt: string | undefined
    }
  | {
      type: 'login'
      accountDid: string
      resultRefreshJwt: string | undefined
    }
  | {
      type: 'logout'
      accountDid: string
    }
  | {
      type: 'remove'
      accountDid: string
    }

const CREDENTIAL_FIELDS = new Set<keyof PersistedAccount>([
  'accessJwt',
  'refreshJwt',
])

/** Read the server-side refresh-token generation, tolerating legacy bad data. */
export function getRefreshJti({
  refreshJwt,
}: {
  refreshJwt: string | undefined
}): string | undefined {
  if (!refreshJwt) return undefined
  try {
    const decoded = jwtDecode(refreshJwt)
    if (typeof decoded.jti === 'string') return decoded.jti
  } catch {}
  /* A malformed legacy token still needs stable local identity. */
  return refreshJwt
}

export function getCredentialState({
  session,
  accountDid,
}: {
  session: Schema['session']
  accountDid: string
}): PersistedCredentialState {
  const stored = session.credentialStates?.[accountDid]
  if (stored) return stored
  const account = session.accounts.find(
    candidate => candidate.did === accountDid,
  )
  return {
    credentialVersion: 0,
    refreshJti: getRefreshJti({refreshJwt: account?.refreshJwt}),
    status: account?.refreshJwt ? 'active' : 'logged-out',
  }
}

/**
 * Apply a session snapshot to the latest persisted session without allowing its
 * credential fields to overwrite newer credential generations.
 */
export function applySessionUpdate({
  storedSession,
  nextSession,
  credentialMutations,
  currentAccountDid,
}: {
  storedSession: Schema['session']
  nextSession: Schema['session']
  credentialMutations: SessionCredentialMutation[]
  currentAccountDid?: string
}): Schema['session'] {
  const incomingByDid = new Map(
    nextSession.accounts.map(account => [account.did, account]),
  )
  const storedByDid = new Map(
    storedSession.accounts.map(account => [account.did, account]),
  )

  /* Incoming metadata wins, but stored credentials remain authoritative. */
  const accounts = nextSession.accounts.map(incoming => {
    const stored = storedByDid.get(incoming.did)
    return stored
      ? mergeAccountMetadata({storedAccount: stored, incomingAccount: incoming})
      : incoming
  })
  for (const stored of storedSession.accounts) {
    if (!incomingByDid.has(stored.did)) accounts.push(stored)
  }

  const credentialStates: Record<string, PersistedCredentialState> = {
    ...storedSession.credentialStates,
  }
  for (const account of storedSession.accounts) {
    credentialStates[account.did] = getCredentialState({
      session: storedSession,
      accountDid: account.did,
    })
  }

  const persistedCurrentDid = storedSession.currentAccount?.did
  const selectedCurrentDid = currentAccountDid ?? persistedCurrentDid
  const result: Schema['session'] = {
    accounts,
    currentAccount: selectedCurrentDid
      ? accounts.find(account => account.did === selectedCurrentDid)
      : undefined,
    credentialStates,
  }

  for (const mutation of credentialMutations) {
    applyCredentialMutation({session: result, nextSession, mutation})
  }

  result.accounts = result.accounts
    .filter(
      account =>
        getCredentialState({session: result, accountDid: account.did})
          .status !== 'removed',
    )
    .map(account => {
      const credentialState = getCredentialState({
        session: result,
        accountDid: account.did,
      })
      return credentialState.status === 'logged-out'
        ? {...account, accessJwt: undefined, refreshJwt: undefined}
        : account
    })

  const currentDid = result.currentAccount?.did
  const currentAccount = currentDid
    ? result.accounts.find(account => account.did === currentDid)
    : undefined
  const currentCredentialState = currentDid
    ? getCredentialState({session: result, accountDid: currentDid})
    : undefined
  result.currentAccount =
    currentAccount && currentCredentialState?.status === 'active'
      ? currentAccount
      : undefined

  return result
}

function applyCredentialMutation({
  session,
  nextSession,
  mutation,
}: {
  session: Schema['session']
  nextSession: Schema['session']
  mutation: SessionCredentialMutation
}) {
  const previousState = getCredentialState({
    session,
    accountDid: mutation.accountDid,
  })
  const nextAccount = nextSession.accounts.find(
    account => account.did === mutation.accountDid,
  )

  switch (mutation.type) {
    case 'refresh': {
      const baseRefreshJti = getRefreshJti({
        refreshJwt: mutation.baseRefreshJwt,
      })
      const resultRefreshJti = getRefreshJti({
        refreshJwt: mutation.resultRefreshJwt,
      })
      if (
        previousState.status !== 'active' ||
        previousState.refreshJti !== baseRefreshJti
      ) {
        /* The stored generation already advanced or became a tombstone. */
        if (resultRefreshJti && previousState.refreshJti !== resultRefreshJti) {
          logger.warn(
            'persisted session: rejected refresh result from a non-authoritative generation',
            {
              credentialVersion: previousState.credentialVersion,
              status: previousState.status,
            },
          )
        }
        return
      }
      if (!nextAccount || !resultRefreshJti) return
      replaceAccount({session, account: nextAccount})
      session.credentialStates![mutation.accountDid] = {
        credentialVersion:
          resultRefreshJti === previousState.refreshJti
            ? previousState.credentialVersion
            : previousState.credentialVersion + 1,
        refreshJti: resultRefreshJti,
        status: 'active',
      }
      return
    }
    case 'expire': {
      const baseRefreshJti = getRefreshJti({
        refreshJwt: mutation.baseRefreshJwt,
      })
      if (
        previousState.status !== 'active' ||
        previousState.refreshJti !== baseRefreshJti
      ) {
        return
      }
      clearAccountCredentials({session, accountDid: mutation.accountDid})
      session.credentialStates![mutation.accountDid] = {
        credentialVersion: previousState.credentialVersion + 1,
        status: 'logged-out',
      }
      return
    }
    case 'login': {
      const resultRefreshJti = getRefreshJti({
        refreshJwt: mutation.resultRefreshJwt,
      })
      if (!nextAccount || !resultRefreshJti) return
      replaceAccount({session, account: nextAccount})
      session.credentialStates![mutation.accountDid] = {
        credentialVersion: previousState.credentialVersion + 1,
        refreshJti: resultRefreshJti,
        status: 'active',
      }
      return
    }
    case 'logout': {
      clearAccountCredentials({session, accountDid: mutation.accountDid})
      session.credentialStates![mutation.accountDid] = {
        credentialVersion: previousState.credentialVersion + 1,
        status: 'logged-out',
      }
      return
    }
    case 'remove': {
      session.accounts = session.accounts.filter(
        account => account.did !== mutation.accountDid,
      )
      session.credentialStates![mutation.accountDid] = {
        credentialVersion: previousState.credentialVersion + 1,
        status: 'removed',
      }
      return
    }
  }
}

function mergeAccountMetadata({
  storedAccount,
  incomingAccount,
}: {
  storedAccount: PersistedAccount
  incomingAccount: PersistedAccount
}): PersistedAccount {
  const merged = {...storedAccount}
  for (const key of Object.keys(
    incomingAccount,
  ) as (keyof PersistedAccount)[]) {
    if (!CREDENTIAL_FIELDS.has(key)) {
      Object.assign(merged, {[key]: incomingAccount[key]})
    }
  }
  return merged
}

function replaceAccount({
  session,
  account,
}: {
  session: Schema['session']
  account: PersistedAccount
}) {
  session.accounts = [
    account,
    ...session.accounts.filter(candidate => candidate.did !== account.did),
  ]
}

function clearAccountCredentials({
  session,
  accountDid,
}: {
  session: Schema['session']
  accountDid: string
}) {
  session.accounts = session.accounts.map(account =>
    account.did === accountDid
      ? {...account, accessJwt: undefined, refreshJwt: undefined}
      : account,
  )
}

import {beforeEach, describe, expect, it, jest} from '@jest/globals'

const mockLoggerWarn = jest.fn()
jest.mock('#/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}))

import {type PersistedAccount, type Schema} from '../schema'
import {
  applySessionUpdate,
  getCredentialState,
  type SessionCredentialMutation,
} from '../session-merge'

const DID = 'did:plc:example123'
const OTHER_DID = 'did:plc:other456'

function jwt({jti, issuedAt}: {jti: string; issuedAt: number}) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({alg: 'none'})}.${encode({jti, iat: issuedAt})}.signature`
}

function account({
  did = DID,
  refreshJwt,
  accessJwt = `access-${refreshJwt}`,
}: {
  did?: PersistedAccount['did']
  refreshJwt?: string
  accessJwt?: string
}): PersistedAccount {
  return {
    service: 'https://bsky.social/',
    did,
    handle: 'alice.test',
    refreshJwt,
    accessJwt,
  }
}

function session({
  account: sessionAccount,
  credentialStates,
}: {
  account?: PersistedAccount
  credentialStates?: Schema['session']['credentialStates']
}): Schema['session'] {
  return {
    accounts: sessionAccount ? [sessionAccount] : [],
    currentAccount: sessionAccount,
    credentialStates,
  }
}

function update({
  storedSession,
  nextAccount,
  mutation,
}: {
  storedSession: Schema['session']
  nextAccount?: PersistedAccount
  mutation?: SessionCredentialMutation
}) {
  return applySessionUpdate({
    storedSession,
    nextSession: session({
      account: nextAccount,
      credentialStates: storedSession.credentialStates,
    }),
    credentialMutations: mutation ? [mutation] : [],
  })
}

describe('versioned persisted sessions', () => {
  const refreshA = jwt({jti: 'A', issuedAt: 1})
  const refreshB = jwt({jti: 'B', issuedAt: 2})
  const refreshBAlias = jwt({jti: 'B', issuedAt: 3})
  const refreshC = jwt({jti: 'C', issuedAt: 4})

  beforeEach(() => {
    mockLoggerWarn.mockClear()
  })

  it('advances the credential version when refresh moves to a new jti', () => {
    const storedSession = session({account: account({refreshJwt: refreshA})})
    const next = account({refreshJwt: refreshB})

    const result = update({
      storedSession,
      nextAccount: next,
      mutation: {
        type: 'refresh',
        accountDid: DID,
        baseRefreshJwt: refreshA,
        resultRefreshJwt: refreshB,
      },
    })

    expect(result.accounts[0].refreshJwt).toBe(refreshB)
    expect(getCredentialState({session: result, accountDid: DID})).toEqual({
      credentialVersion: 1,
      refreshJti: 'B',
      status: 'active',
    })
  })

  it('keeps one version for convergent aliases with the same jti', () => {
    const generationB = update({
      storedSession: session({account: account({refreshJwt: refreshA})}),
      nextAccount: account({refreshJwt: refreshB}),
      mutation: {
        type: 'refresh',
        accountDid: DID,
        baseRefreshJwt: refreshA,
        resultRefreshJwt: refreshB,
      },
    })

    const result = update({
      storedSession: generationB,
      nextAccount: account({refreshJwt: refreshBAlias}),
      mutation: {
        type: 'refresh',
        accountDid: DID,
        baseRefreshJwt: refreshA,
        resultRefreshJwt: refreshBAlias,
      },
    })

    expect(result.accounts[0].refreshJwt).toBe(refreshB)
    expect(
      getCredentialState({session: result, accountDid: DID}).credentialVersion,
    ).toBe(1)
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })

  it('does not let a stale refresh overwrite a newer generation', () => {
    const storedSession = session({
      account: account({refreshJwt: refreshB}),
      credentialStates: {
        [DID]: {credentialVersion: 8, refreshJti: 'B', status: 'active'},
      },
    })

    const result = update({
      storedSession,
      nextAccount: account({refreshJwt: refreshC}),
      mutation: {
        type: 'refresh',
        accountDid: DID,
        baseRefreshJwt: refreshA,
        resultRefreshJwt: refreshC,
      },
    })

    expect(result.accounts[0].refreshJwt).toBe(refreshB)
    expect(
      getCredentialState({session: result, accountDid: DID}).credentialVersion,
    ).toBe(8)
  })

  it('logs when a missing lineage link rejects a newer refresh result', () => {
    const storedSession = session({
      account: account({refreshJwt: refreshA}),
    })

    const result = update({
      storedSession,
      nextAccount: account({refreshJwt: refreshC}),
      mutation: {
        type: 'refresh',
        accountDid: DID,
        baseRefreshJwt: refreshB,
        resultRefreshJwt: refreshC,
      },
    })

    expect(result.accounts[0].refreshJwt).toBe(refreshA)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'persisted session: rejected refresh result from a non-authoritative generation',
      {credentialVersion: 0, status: 'active'},
    )
  })

  it('patches metadata without replacing authoritative credentials', () => {
    const storedSession = session({
      account: account({refreshJwt: refreshB}),
      credentialStates: {
        [DID]: {credentialVersion: 8, refreshJti: 'B', status: 'active'},
      },
    })
    const staleAccount = {
      ...account({refreshJwt: refreshA}),
      handle: 'alice-renamed.test',
    }

    const result = update({storedSession, nextAccount: staleAccount})

    expect(result.accounts[0].handle).toBe('alice-renamed.test')
    expect(result.accounts[0].refreshJwt).toBe(refreshB)
    expect(result.accounts[0].accessJwt).toBe(`access-${refreshB}`)
  })

  it('preserves the persisted current account for ordinary updates', () => {
    const alice = account({refreshJwt: refreshA})
    const bob = {
      ...account({did: OTHER_DID, refreshJwt: refreshB}),
      handle: 'bob.test',
    }
    const result = applySessionUpdate({
      storedSession: {
        accounts: [alice, bob],
        currentAccount: bob,
      },
      nextSession: {
        accounts: [{...alice, handle: 'alice-renamed.test'}, bob],
        currentAccount: alice,
      },
      credentialMutations: [],
    })

    expect(result.currentAccount?.did).toBe(OTHER_DID)
  })

  it('changes the persisted current account for an explicit selection', () => {
    const alice = account({refreshJwt: refreshA})
    const bob = {
      ...account({did: OTHER_DID, refreshJwt: refreshB}),
      handle: 'bob.test',
    }
    const result = applySessionUpdate({
      storedSession: {
        accounts: [alice, bob],
        currentAccount: bob,
      },
      nextSession: {
        accounts: [alice, bob],
        currentAccount: alice,
      },
      credentialMutations: [],
      currentAccountDid: DID,
    })

    expect(result.currentAccount?.did).toBe(DID)
  })

  it('does not let a stale expiry clear a newer generation', () => {
    const storedSession = session({
      account: account({refreshJwt: refreshB}),
      credentialStates: {
        [DID]: {credentialVersion: 8, refreshJti: 'B', status: 'active'},
      },
    })

    const result = update({
      storedSession,
      nextAccount: account({refreshJwt: undefined, accessJwt: undefined}),
      mutation: {
        type: 'expire',
        accountDid: DID,
        baseRefreshJwt: refreshA,
      },
    })

    expect(result.accounts[0].refreshJwt).toBe(refreshB)
    expect(getCredentialState({session: result, accountDid: DID}).status).toBe(
      'active',
    )
  })

  it('preserves logout and removal tombstones until an explicit login', () => {
    const active = session({
      account: account({refreshJwt: refreshB}),
      credentialStates: {
        [DID]: {credentialVersion: 8, refreshJti: 'B', status: 'active'},
      },
    })
    const loggedOut = update({
      storedSession: active,
      nextAccount: account({refreshJwt: undefined, accessJwt: undefined}),
      mutation: {type: 'logout', accountDid: DID},
    })

    expect(loggedOut.currentAccount).toBeUndefined()

    const staleRefresh = update({
      storedSession: loggedOut,
      nextAccount: account({refreshJwt: refreshC}),
      mutation: {
        type: 'refresh',
        accountDid: DID,
        baseRefreshJwt: refreshB,
        resultRefreshJwt: refreshC,
      },
    })
    expect(staleRefresh.accounts[0].refreshJwt).toBeUndefined()
    expect(
      getCredentialState({session: staleRefresh, accountDid: DID}),
    ).toEqual({credentialVersion: 9, status: 'logged-out'})

    const removed = update({
      storedSession: staleRefresh,
      mutation: {type: 'remove', accountDid: DID},
    })
    const staleSnapshot = update({
      storedSession: removed,
      nextAccount: account({refreshJwt: refreshB}),
    })
    expect(staleSnapshot.accounts).toEqual([])
    expect(
      getCredentialState({session: staleSnapshot, accountDid: DID}),
    ).toEqual({credentialVersion: 10, status: 'removed'})

    const loggedIn = update({
      storedSession: staleSnapshot,
      nextAccount: account({refreshJwt: refreshC}),
      mutation: {
        type: 'login',
        accountDid: DID,
        resultRefreshJwt: refreshC,
      },
    })
    expect(loggedIn.accounts[0].refreshJwt).toBe(refreshC)
    expect(getCredentialState({session: loggedIn, accountDid: DID})).toEqual({
      credentialVersion: 11,
      refreshJti: 'C',
      status: 'active',
    })
  })
})

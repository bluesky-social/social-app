import {type SessionData} from '@atproto/lex-password-session'
import {describe, expect, it, jest} from '@jest/globals'

import {type Action, getInitialState, reducer, type State} from '../reducer'
import {sessionDataToSessionAccount} from '../session-core'
import {type SessionAccount} from '../types'

jest.mock('jwt-decode', () => ({
  jwtDecode(_token: string) {
    return {}
  },
}))

jest.mock('../../birthdate')
jest.mock('../../../ageAssurance/data')
jest.mock('../../../ageAssurance/state', () => ({
  unsafeGetAndComputeAgeAssurance: () => ({state: {}}),
}))
jest.mock('#/lib/notifications/notifications', () => ({
  unregisterPushToken(_clients: unknown[]) {
    return Promise.resolve()
  },
}))
/*
 * The logout and account-removal reducer cases fire a push-token side effect
 * whose first step, `createTemporaryClientsAndResume`, resumes real
 * `PasswordSession`s over the real network. Under jest that request outlives the
 * suite: it rejects after teardown, and the resulting `logger.error` reaches
 * for `nanoid` in an environment that no longer has it, failing whichever suite
 * happens to be running at that moment. Stubbing the module keeps the side
 * effect synchronous and offline.
 */
jest.mock('../util', () => ({
  createTemporaryClientsAndResume: () => Promise.resolve([]),
}))

// Reuse a bundle within each test: session events are scoped by bundle identity.
function makeBundle(service: string) {
  return {service: new URL(service)}
}

function makeAccount(
  service: string,
  session: {
    active: boolean
    did: string
    handle: string
    accessJwt: string
    refreshJwt: string
    email?: string
    emailAuthFactor?: boolean
    emailConfirmed?: boolean
  },
): SessionAccount {
  const account = sessionDataToSessionAccount(
    session as unknown as SessionData,
    service,
  )
  if (!account) {
    throw new Error('Expected an account')
  }
  return account
}

describe('session', () => {
  it('can log in and out', () => {
    let state = getInitialState([])
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": false,
      }
    `)

    const aliceBundle = makeBundle('https://alice.com')
    const aliceAccount = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    })
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: aliceAccount,
      },
    ])
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-1",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    state = run(state, [
      {
        type: 'logged-out-every-account',
      },
    ])
    // Should keep the account but clear out the tokens.
    expect(state.currentBundleState.did).toBe(undefined)
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)
  })

  it('switches to the latest account, stores all of them', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const aliceAccount = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    })
    state = run(state, [
      {
        // Switch to Alice.
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: aliceAccount,
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(state.currentBundleState.bundle).toBe(aliceBundle)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-1",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    const bobBundle = makeBundle('https://bob.com')
    const bobAccount = makeAccount('https://bob.com', {
      active: true,
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    })
    state = run(state, [
      {
        // Switch to Bob.
        type: 'switched-to-account',
        newBundle: bobBundle,
        newAccount: bobAccount,
      },
    ])
    expect(state.accounts.length).toBe(2)
    // Bob should float upwards.
    expect(state.accounts[0].did).toBe('bob-did')
    expect(state.accounts[1].did).toBe('alice-did')
    expect(state.currentBundleState.did).toBe('bob-did')
    expect(state.currentBundleState.bundle).toBe(bobBundle)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "bob-access-jwt-1",
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": "alice-access-jwt-1",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": true,
      }
    `)

    const aliceBundle2 = makeBundle('https://alice.com')
    const aliceAccount2 = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
    })
    state = run(state, [
      {
        // Switch back to Alice.
        type: 'switched-to-account',
        newBundle: aliceBundle2,
        newAccount: aliceAccount2,
      },
    ])
    expect(state.accounts.length).toBe(2)
    // Alice should float upwards.
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(state.currentBundleState.bundle).toBe(aliceBundle2)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-2",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": "bob-access-jwt-1",
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    const jayBundle = makeBundle('https://jay.com')
    const jayAccount = makeAccount('https://jay.com', {
      active: true,
      did: 'jay-did',
      handle: 'jay.test',
      accessJwt: 'jay-access-jwt-1',
      refreshJwt: 'jay-refresh-jwt-1',
    })
    state = run(state, [
      {
        // Switch to Jay.
        type: 'switched-to-account',
        newBundle: jayBundle,
        newAccount: jayAccount,
      },
    ])
    expect(state.accounts.length).toBe(3)
    expect(state.accounts[0].did).toBe('jay-did')
    expect(state.currentBundleState.did).toBe('jay-did')
    expect(state.currentBundleState.bundle).toBe(jayBundle)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "jay-access-jwt-1",
            "active": true,
            "did": "jay-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "jay.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "jay-refresh-jwt-1",
            "service": "https://jay.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": "alice-access-jwt-2",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": "bob-access-jwt-1",
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://jay.com/",
          },
          "did": "jay-did",
        },
        "needsPersist": true,
      }
    `)

    state = run(state, [
      {
        // Log everyone out.
        type: 'logged-out-every-account',
      },
    ])
    expect(state.accounts.length).toBe(3)
    expect(state.currentBundleState.did).toBe(undefined)
    // All tokens should be gone.
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.accounts[1].accessJwt).toBe(undefined)
    expect(state.accounts[1].refreshJwt).toBe(undefined)
    expect(state.accounts[2].accessJwt).toBe(undefined)
    expect(state.accounts[2].refreshJwt).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "active": true,
            "did": "jay-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "jay.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://jay.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": undefined,
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": undefined,
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://bob.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)
  })

  it('can log back in after logging out', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const aliceAccount = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    })
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: aliceAccount,
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentBundleState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'logged-out-every-account',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.currentBundleState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)

    const aliceBundle2 = makeBundle('https://alice.com')
    const aliceAccount2 = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
    })
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle2,
        newAccount: aliceAccount2,
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2')
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-2",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)
  })

  it('can remove active account', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const aliceAccount = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    })
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: aliceAccount,
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentBundleState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'removed-account',
        accountDid: 'alice-did',
      },
    ])
    expect(state.accounts.length).toBe(0)
    expect(state.currentBundleState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)
  })

  it('can remove inactive account', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const aliceAccount = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    })
    const bobBundle = makeBundle('https://bob.com')
    const bobAccount = makeAccount('https://bob.com', {
      active: true,
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    })
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: aliceAccount,
      },
      {
        type: 'switched-to-account',
        newBundle: bobBundle,
        newAccount: bobAccount,
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.currentBundleState.did).toBe('bob-did')

    state = run(state, [
      {
        type: 'removed-account',
        accountDid: 'alice-did',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentBundleState.did).toBe('bob-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "bob-access-jwt-1",
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": true,
      }
    `)

    state = run(state, [
      {
        type: 'removed-account',
        accountDid: 'bob-did',
      },
    ])
    expect(state.accounts.length).toBe(0)
    expect(state.currentBundleState.did).toBe(undefined)
  })

  it('can log out of the current account', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const aliceAccount = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    })
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: aliceAccount,
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentBundleState.did).toBe('alice-did')

    const bobBundle = makeBundle('https://bob.com')
    const bobAccount = makeAccount('https://bob.com', {
      active: true,
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    })
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: bobBundle,
        newAccount: bobAccount,
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('bob-refresh-jwt-1')
    expect(state.currentBundleState.did).toBe('bob-did')

    state = run(state, [
      {
        type: 'logged-out-current-account',
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.accounts[1].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[1].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentBundleState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://bob.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": "alice-access-jwt-1",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)
  })

  it('updates stored account with refreshed tokens', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentBundleState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice-updated.test',
          accessJwt: 'alice-access-jwt-2',
          refreshJwt: 'alice-refresh-jwt-2',
          email: 'alice@foo.bar',
          emailAuthFactor: false,
          emailConfirmed: false,
        }),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].email).toBe('alice@foo.bar')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2')
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-2",
            "active": true,
            "did": "alice-did",
            "email": "alice@foo.bar",
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice-updated.test',
          accessJwt: 'alice-access-jwt-3',
          refreshJwt: 'alice-refresh-jwt-3',
          email: 'alice@foo.baz',
          emailAuthFactor: true,
          emailConfirmed: true,
        }),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].email).toBe('alice@foo.baz')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-3')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-3')
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-3",
            "active": true,
            "did": "alice-did",
            "email": "alice@foo.baz",
            "emailAuthFactor": true,
            "emailConfirmed": true,
            "handle": "alice-updated.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-3",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice-updated.test',
          accessJwt: 'alice-access-jwt-4',
          refreshJwt: 'alice-refresh-jwt-4',
          email: 'alice@foo.baz',
          emailAuthFactor: false,
          emailConfirmed: false,
        }),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].email).toBe('alice@foo.baz')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-4')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-4')
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-4",
            "active": true,
            "did": "alice-did",
            "email": "alice@foo.baz",
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-4",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)
  })

  it('bails out of update on identical objects', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentBundleState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice-updated.test',
          accessJwt: 'alice-access-jwt-2',
          refreshJwt: 'alice-refresh-jwt-2',
        }),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')

    const lastState = state
    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice-updated.test',
          accessJwt: 'alice-access-jwt-2',
          refreshJwt: 'alice-refresh-jwt-2',
        }),
        sessionEvent: 'update',
      },
    ])
    expect(lastState === state).toBe(true)

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice-updated.test',
          accessJwt: 'alice-access-jwt-3',
          refreshJwt: 'alice-refresh-jwt-3',
        }),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-3')
  })

  it('ignores updates from a stale bundle', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const bobBundle = makeBundle('https://bob.com')

    state = run(state, [
      {
        // Switch to Alice.
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
      {
        // Switch to Bob.
        type: 'switched-to-account',
        newBundle: bobBundle,
        newAccount: makeAccount('https://bob.com', {
          active: true,
          did: 'bob-did',
          handle: 'bob.test',
          accessJwt: 'bob-access-jwt-1',
          refreshJwt: 'bob-refresh-jwt-1',
        }),
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.currentBundleState.did).toBe('bob-did')

    /*
     * An 'update' from the stale (background) Alice bundle is dropped
     * ENTIRELY - identical state object, no token write. A refresh completing
     * after switching away must not resurrect fresh tokens into the
     * switched-away account entry.
     */
    const beforeStaleUpdate = state
    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice-updated.test',
          accessJwt: 'alice-access-jwt-2',
          refreshJwt: 'alice-refresh-jwt-2',
          email: 'alice@foo.bar',
          emailAuthFactor: false,
          emailConfirmed: false,
        }),
        sessionEvent: 'update',
      },
    ])
    expect(beforeStaleUpdate === state).toBe(true)
    expect(state.accounts[1].did).toBe('alice-did')
    // Alice's stored tokens are untouched (the stale update did not land).
    expect(state.accounts[1].handle).toBe('alice.test')
    expect(state.accounts[1].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[1].refreshJwt).toBe('alice-refresh-jwt-1')

    state = run(state, [
      {
        // Update Bob (the current bundle) - this still applies.
        type: 'received-session-event',
        accountDid: 'bob-did',
        bundle: bobBundle,
        refreshedAccount: makeAccount('https://bob.com', {
          active: true,
          did: 'bob-did',
          handle: 'bob-updated.test',
          accessJwt: 'bob-access-jwt-2',
          refreshJwt: 'bob-refresh-jwt-2',
        }),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.accounts[0].did).toBe('bob-did')
    // Should update Bob's tokens because otherwise they'll be stale.
    expect(state.accounts[0].handle).toBe('bob-updated.test')
    expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('bob-refresh-jwt-2')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "bob-access-jwt-2",
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob-updated.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-2",
            "service": "https://bob.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": "alice-access-jwt-1",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": true,
      }
    `)

    // Ignore other events for the inactive bundle too (network-error, expired).
    const lastState = state
    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: undefined,
        sessionEvent: 'network-error',
      },
    ])
    expect(lastState === state).toBe(true)
    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: undefined,
        sessionEvent: 'expired',
      },
    ])
    expect(lastState === state).toBe(true)
  })

  it('drops an update from a stale bundle even when its account entry still exists (no resurrection)', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
    ])
    expect(state.currentBundleState.did).toBe('alice-did')

    // Alice logs out: her account entry stays, but tokens are cleared and the
    // current bundle becomes the public (logged-out) bundle.
    state = run(state, [{type: 'logged-out-current-account'}])
    expect(state.currentBundleState.did).toBe(undefined)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)

    /*
     * A refresh that was already in flight on the (now stale) Alice bundle
     * completes and delivers fresh tokens. It must NOT resurrect them into the
     * soft-logged-out account entry - the bundle no longer matches the current
     * (public) bundle, so the event is dropped entirely.
     */
    const afterLogout = state
    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-2',
          refreshJwt: 'alice-refresh-jwt-2',
        }),
        sessionEvent: 'update',
      },
    ])
    expect(afterLogout === state).toBe(true)
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.currentBundleState.did).toBe(undefined)
  })

  it('applies an update from the current bundle', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
    ])

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-2',
          refreshJwt: 'alice-refresh-jwt-2',
        }),
        sessionEvent: 'update',
      },
    ])
    // The current bundle's update lands and rotates the stored tokens.
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2')
    expect(state.currentBundleState.did).toBe('alice-did')
  })

  it('ignores updates from a removed bundle', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const bobBundle = makeBundle('https://bob.com')

    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
      {
        type: 'switched-to-account',
        newBundle: bobBundle,
        newAccount: makeAccount('https://bob.com', {
          active: true,
          did: 'bob-did',
          handle: 'bob.test',
          accessJwt: 'bob-access-jwt-1',
          refreshJwt: 'bob-refresh-jwt-1',
        }),
      },
      {
        type: 'removed-account',
        accountDid: 'alice-did',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentBundleState.did).toBe('bob-did')

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-2',
          refreshJwt: 'alice-refresh-jwt-2',
        }),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('bob-did')
    expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-1')
    expect(state.currentBundleState.did).toBe('bob-did')
  })

  it('ignores network errors', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        // Switch to Alice.
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentBundleState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: undefined,
        sessionEvent: 'network-error',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-1",
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)
  })

  it('resets tokens on expired event', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.currentBundleState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'received-session-event',
        accountDid: 'alice-did',
        bundle: aliceBundle,
        refreshedAccount: undefined,
        sessionEvent: 'expired',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.currentBundleState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "active": true,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)
  })

  it('replaces local accounts with synced accounts', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    const bobBundle = makeBundle('https://bob.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
      {
        type: 'switched-to-account',
        newBundle: bobBundle,
        newAccount: makeAccount('https://bob.com', {
          active: true,
          did: 'bob-did',
          handle: 'bob.test',
          accessJwt: 'bob-access-jwt-1',
          refreshJwt: 'bob-refresh-jwt-1',
        }),
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.currentBundleState.did).toBe('bob-did')

    state = run(state, [
      {
        type: 'synced-accounts',
        syncedAccounts: [
          makeAccount('https://jay.com', {
            active: true,
            did: 'jay-did',
            handle: 'jay.test',
            accessJwt: 'jay-access-jwt-1',
            refreshJwt: 'jay-refresh-jwt-1',
          }),
          makeAccount('https://alice.com', {
            active: true,
            did: 'bob-did',
            handle: 'bob.test',
            accessJwt: 'bob-access-jwt-2',
            refreshJwt: 'bob-refresh-jwt-2',
          }),
        ],
        syncedCurrentDid: 'bob-did',
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.accounts[0].did).toBe('jay-did')
    expect(state.accounts[1].did).toBe('bob-did')
    expect(state.accounts[1].accessJwt).toBe('bob-access-jwt-2')
    // Keep Bob logged in.
    // (The bundle is rebuilt from the synced tokens outside the reducer.)
    expect(state.currentBundleState.did).toBe('bob-did')
    expect(state.needsPersist).toBe(false)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "jay-access-jwt-1",
            "active": true,
            "did": "jay-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "jay.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "jay-refresh-jwt-1",
            "service": "https://jay.com/",
            "signupQueued": false,
            "status": undefined,
          },
          {
            "accessJwt": "bob-access-jwt-2",
            "active": true,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-2",
            "service": "https://alice.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": false,
      }
    `)

    state = run(state, [
      {
        type: 'synced-accounts',
        syncedAccounts: [
          makeAccount('https://clarence.com', {
            active: true,
            did: 'clarence-did',
            handle: 'clarence.test',
            accessJwt: 'clarence-access-jwt-2',
            refreshJwt: 'clarence-refresh-jwt-2',
          }),
        ],
        syncedCurrentDid: 'clarence-did',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('clarence-did')
    // Log out because we have no matching user.
    // (In practice, we'll resume this session outside the reducer.)
    expect(state.currentBundleState.did).toBe(undefined)
    expect(state.needsPersist).toBe(false)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "clarence-access-jwt-2",
            "active": true,
            "did": "clarence-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "clarence.test",
            "isSelfHosted": true,
            "pdsUrl": undefined,
            "refreshJwt": "clarence-refresh-jwt-2",
            "service": "https://clarence.com/",
            "signupQueued": false,
            "status": undefined,
          },
        ],
        "currentBundleState": {
          "bundle": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": false,
      }
    `)
  })

  it('replaces the current bundle on same-did cross-tab sync', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
        }),
      },
    ])
    expect(state.currentBundleState.bundle).toBe(aliceBundle)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')

    // A fresh bundle rebuilt from synced tokens (no network).
    const aliceBundle2 = makeBundle('https://alice.com')
    const aliceAccount2 = makeAccount('https://alice.com', {
      active: true,
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
    })
    state = run(state, [
      {
        type: 'replaced-current-bundle',
        newBundle: aliceBundle2,
        newAccount: aliceAccount2,
      },
    ])
    // The bundle is swapped in place, the did is preserved.
    expect(state.currentBundleState.bundle).toBe(aliceBundle2)
    expect(state.currentBundleState.did).toBe('alice-did')
    // The matching account entry is replaced with the synced one.
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2')
    // Synced from another tab - don't persist.
    expect(state.needsPersist).toBe(false)
  })

  it('does not touch the bundle on partial-refresh-session', () => {
    let state = getInitialState([])

    const aliceBundle = makeBundle('https://alice.com')
    state = run(state, [
      {
        type: 'switched-to-account',
        newBundle: aliceBundle,
        newAccount: makeAccount('https://alice.com', {
          active: true,
          did: 'alice-did',
          handle: 'alice.test',
          accessJwt: 'alice-access-jwt-1',
          refreshJwt: 'alice-refresh-jwt-1',
          email: 'alice@foo.bar',
          emailAuthFactor: false,
          emailConfirmed: false,
        }),
      },
    ])
    expect(state.currentBundleState.bundle).toBe(aliceBundle)
    expect(state.accounts[0].emailConfirmed).toBe(false)
    expect(state.accounts[0].emailAuthFactor).toBe(false)

    state = run(state, [
      {
        type: 'partial-refresh-session',
        accountDid: 'alice-did',
        patch: {emailConfirmed: true, emailAuthFactor: true},
      },
    ])
    // The account email fields are patched.
    expect(state.accounts[0].emailConfirmed).toBe(true)
    expect(state.accounts[0].emailAuthFactor).toBe(true)
    // The bundle is untouched - no session mutation, same reference.
    expect(state.currentBundleState.bundle).toBe(aliceBundle)
    expect(state.currentBundleState.did).toBe('alice-did')
    expect(state.needsPersist).toBe(true)
  })
})

function run(initialState: State, actions: Action[]): State {
  let state = initialState
  for (let action of actions) {
    state = reducer(state, action)
  }
  return state
}

function printState(state: State) {
  return {
    accounts: state.accounts,
    currentBundleState: {
      bundle: {service: state.currentBundleState.bundle.service},
      did: state.currentBundleState.did,
    },
    needsPersist: state.needsPersist,
  }
}

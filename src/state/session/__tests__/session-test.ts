import {BskyAgent} from '@atproto/api'
import {describe, expect, it, jest} from '@jest/globals'

import {agentToSessionAccountOrThrow} from '../agent'
import {Action, getInitialState, reducer, State} from '../reducer'

jest.mock('jwt-decode', () => ({
  jwtDecode(_token: string) {
    return {}
  },
}))

describe('session', () => {
  it('can log in and out', () => {
    let state = getInitialState([])
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [],
        "currentAgentState": {
          "agent": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": false,
      }
    `)

    const agent = new BskyAgent({service: 'https://alice.com'})
    agent.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent,
        newAccount: agentToSessionAccountOrThrow(agent),
      },
    ])
    expect(state.currentAgentState.did).toBe('alice-did')
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-1",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    state = run(state, [
      {
        type: 'logged-out',
      },
    ])
    // Should keep the account but clear out the tokens.
    expect(state.currentAgentState.did).toBe(undefined)
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
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

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        // Switch to Alice.
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.currentAgentState.did).toBe('alice-did')
    expect(state.currentAgentState.agent).toBe(agent1)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-1",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    const agent2 = new BskyAgent({service: 'https://bob.com'})
    agent2.session = {
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    }
    state = run(state, [
      {
        // Switch to Bob.
        type: 'switched-to-account',
        newAgent: agent2,
        newAccount: agentToSessionAccountOrThrow(agent2),
      },
    ])
    expect(state.accounts.length).toBe(2)
    // Bob should float upwards.
    expect(state.accounts[0].did).toBe('bob-did')
    expect(state.accounts[1].did).toBe('alice-did')
    expect(state.currentAgentState.did).toBe('bob-did')
    expect(state.currentAgentState.agent).toBe(agent2)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "bob-access-jwt-1",
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
          },
          {
            "accessJwt": "alice-access-jwt-1",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": true,
      }
    `)

    const agent3 = new BskyAgent({service: 'https://alice.com'})
    agent3.session = {
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
    }
    state = run(state, [
      {
        // Switch back to Alice.
        type: 'switched-to-account',
        newAgent: agent3,
        newAccount: agentToSessionAccountOrThrow(agent3),
      },
    ])
    expect(state.accounts.length).toBe(2)
    // Alice should float upwards.
    expect(state.accounts[0].did).toBe('alice-did')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.currentAgentState.did).toBe('alice-did')
    expect(state.currentAgentState.agent).toBe(agent3)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-2",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
          },
          {
            "accessJwt": "bob-access-jwt-1",
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    const agent4 = new BskyAgent({service: 'https://jay.com'})
    agent4.session = {
      did: 'jay-did',
      handle: 'jay.test',
      accessJwt: 'jay-access-jwt-1',
      refreshJwt: 'jay-refresh-jwt-1',
    }
    state = run(state, [
      {
        // Switch to Jay.
        type: 'switched-to-account',
        newAgent: agent4,
        newAccount: agentToSessionAccountOrThrow(agent4),
      },
    ])
    expect(state.accounts.length).toBe(3)
    expect(state.accounts[0].did).toBe('jay-did')
    expect(state.currentAgentState.did).toBe('jay-did')
    expect(state.currentAgentState.agent).toBe(agent4)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "jay-access-jwt-1",
            "deactivated": false,
            "did": "jay-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "jay.test",
            "pdsUrl": undefined,
            "refreshJwt": "jay-refresh-jwt-1",
            "service": "https://jay.com/",
          },
          {
            "accessJwt": "alice-access-jwt-2",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
          },
          {
            "accessJwt": "bob-access-jwt-1",
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
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
        type: 'logged-out',
      },
    ])
    expect(state.accounts.length).toBe(3)
    expect(state.currentAgentState.did).toBe(undefined)
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
            "deactivated": false,
            "did": "jay-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "jay.test",
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://jay.com/",
          },
          {
            "accessJwt": undefined,
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
          },
          {
            "accessJwt": undefined,
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://bob.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
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

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentAgentState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'logged-out',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.currentAgentState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)

    const agent2 = new BskyAgent({service: 'https://alice.com'})
    agent2.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent2,
        newAccount: agentToSessionAccountOrThrow(agent2),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2')
    expect(state.currentAgentState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-2",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
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

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentAgentState.did).toBe('alice-did')

    state = run(state, [
      {
        type: 'removed-account',
        accountDid: 'alice-did',
      },
    ])
    expect(state.accounts.length).toBe(0)
    expect(state.currentAgentState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [],
        "currentAgentState": {
          "agent": {
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

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    const agent2 = new BskyAgent({service: 'https://bob.com'})
    agent2.session = {
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
      {
        type: 'switched-to-account',
        newAgent: agent2,
        newAccount: agentToSessionAccountOrThrow(agent2),
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.currentAgentState.did).toBe('bob-did')

    state = run(state, [
      {
        type: 'removed-account',
        accountDid: 'alice-did',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentAgentState.did).toBe('bob-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "bob-access-jwt-1",
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
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
    expect(state.currentAgentState.did).toBe(undefined)
  })

  it('updates stored account with refreshed tokens', () => {
    let state = getInitialState([])

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentAgentState.did).toBe('alice-did')

    agent1.session = {
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
      email: 'alice@foo.bar',
      emailAuthFactor: false,
      emailConfirmed: false,
    }
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].email).toBe('alice@foo.bar')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-2')
    expect(state.currentAgentState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-2",
            "deactivated": false,
            "did": "alice-did",
            "email": "alice@foo.bar",
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-2",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    agent1.session = {
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-3',
      refreshJwt: 'alice-refresh-jwt-3',
      email: 'alice@foo.baz',
      emailAuthFactor: true,
      emailConfirmed: true,
    }
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].email).toBe('alice@foo.baz')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-3')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-3')
    expect(state.currentAgentState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-3",
            "deactivated": false,
            "did": "alice-did",
            "email": "alice@foo.baz",
            "emailAuthFactor": true,
            "emailConfirmed": true,
            "handle": "alice-updated.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-3",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://alice.com/",
          },
          "did": "alice-did",
        },
        "needsPersist": true,
      }
    `)

    agent1.session = {
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-4',
      refreshJwt: 'alice-refresh-jwt-4',
      email: 'alice@foo.baz',
      emailAuthFactor: false,
      emailConfirmed: false,
    }
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].email).toBe('alice@foo.baz')
    expect(state.accounts[0].handle).toBe('alice-updated.test')
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-4')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-4')
    expect(state.currentAgentState.did).toBe('alice-did')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-4",
            "deactivated": false,
            "did": "alice-did",
            "email": "alice@foo.baz",
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice-updated.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-4",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
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

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentAgentState.did).toBe('alice-did')

    agent1.session = {
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
    }
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-2')

    const lastState = state
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(lastState === state).toBe(true)

    agent1.session = {
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-3',
      refreshJwt: 'alice-refresh-jwt-3',
    }
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-3')
  })

  it('ignores updates from a stale agent', () => {
    let state = getInitialState([])

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }

    const agent2 = new BskyAgent({service: 'https://bob.com'})
    agent2.session = {
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    }

    state = run(state, [
      {
        // Switch to Alice.
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
      {
        // Switch to Bob.
        type: 'switched-to-account',
        newAgent: agent2,
        newAccount: agentToSessionAccountOrThrow(agent2),
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.currentAgentState.did).toBe('bob-did')

    agent1.session = {
      did: 'alice-did',
      handle: 'alice-updated.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
      email: 'alice@foo.bar',
      emailAuthFactor: false,
      emailConfirmed: false,
    }
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.accounts[1].did).toBe('alice-did')
    // Should retain the old values because Alice is not active.
    expect(state.accounts[1].handle).toBe('alice.test')
    expect(state.accounts[1].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[1].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "bob-access-jwt-1",
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-1",
            "service": "https://bob.com/",
          },
          {
            "accessJwt": "alice-access-jwt-1",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": true,
      }
    `)

    agent2.session = {
      did: 'bob-did',
      handle: 'bob-updated.test',
      accessJwt: 'bob-access-jwt-2',
      refreshJwt: 'bob-refresh-jwt-2',
    }
    state = run(state, [
      {
        // Update Bob.
        type: 'received-agent-event',
        accountDid: 'bob-did',
        agent: agent2,
        refreshedAccount: agentToSessionAccountOrThrow(agent2),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.accounts[0].did).toBe('bob-did')
    // Should update the values because Bob is active.
    expect(state.accounts[0].handle).toBe('bob-updated.test')
    expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-2')
    expect(state.accounts[0].refreshJwt).toBe('bob-refresh-jwt-2')
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "bob-access-jwt-2",
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob-updated.test",
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-2",
            "service": "https://bob.com/",
          },
          {
            "accessJwt": "alice-access-jwt-1",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": true,
      }
    `)

    // Ignore other events for inactive agent too.
    const lastState = state
    agent1.session = undefined
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: undefined,
        sessionEvent: 'network-error',
      },
    ])
    expect(lastState === state).toBe(true)
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: undefined,
        sessionEvent: 'expired',
      },
    ])
    expect(lastState === state).toBe(true)
  })

  it('ignores updates from a removed agent', () => {
    let state = getInitialState([])

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }

    const agent2 = new BskyAgent({service: 'https://bob.com'})
    agent2.session = {
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    }

    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
      {
        type: 'switched-to-account',
        newAgent: agent2,
        newAccount: agentToSessionAccountOrThrow(agent2),
      },
      {
        type: 'removed-account',
        accountDid: 'alice-did',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentAgentState.did).toBe('bob-did')

    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-2',
      refreshJwt: 'alice-refresh-jwt-2',
    }
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: agentToSessionAccountOrThrow(agent1),
        sessionEvent: 'update',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('bob-did')
    expect(state.accounts[0].accessJwt).toBe('bob-access-jwt-1')
    expect(state.currentAgentState.did).toBe('bob-did')
  })

  it('does soft logout on network error', () => {
    let state = getInitialState([])

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        // Switch to Alice.
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.currentAgentState.did).toBe('alice-did')

    agent1.session = undefined
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: undefined,
        sessionEvent: 'network-error',
      },
    ])
    expect(state.accounts.length).toBe(1)
    // Network error should reset current user but not reset the tokens.
    // TODO: We might want to remove or change this behavior?
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.accounts[0].refreshJwt).toBe('alice-refresh-jwt-1')
    expect(state.currentAgentState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "alice-access-jwt-1",
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": "alice-refresh-jwt-1",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)
  })

  it('resets tokens on expired event', () => {
    let state = getInitialState([])

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.currentAgentState.did).toBe('alice-did')

    agent1.session = undefined
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: undefined,
        sessionEvent: 'expired',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.currentAgentState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": true,
      }
    `)
  })

  it('resets tokens on created-failed event', () => {
    let state = getInitialState([])

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe('alice-access-jwt-1')
    expect(state.currentAgentState.did).toBe('alice-did')

    agent1.session = undefined
    state = run(state, [
      {
        type: 'received-agent-event',
        accountDid: 'alice-did',
        agent: agent1,
        refreshedAccount: undefined,
        sessionEvent: 'create-failed',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].accessJwt).toBe(undefined)
    expect(state.accounts[0].refreshJwt).toBe(undefined)
    expect(state.currentAgentState.did).toBe(undefined)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": undefined,
            "deactivated": false,
            "did": "alice-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "alice.test",
            "pdsUrl": undefined,
            "refreshJwt": undefined,
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
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

    const agent1 = new BskyAgent({service: 'https://alice.com'})
    agent1.session = {
      did: 'alice-did',
      handle: 'alice.test',
      accessJwt: 'alice-access-jwt-1',
      refreshJwt: 'alice-refresh-jwt-1',
    }
    const agent2 = new BskyAgent({service: 'https://bob.com'})
    agent2.session = {
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-1',
      refreshJwt: 'bob-refresh-jwt-1',
    }
    state = run(state, [
      {
        type: 'switched-to-account',
        newAgent: agent1,
        newAccount: agentToSessionAccountOrThrow(agent1),
      },
      {
        type: 'switched-to-account',
        newAgent: agent2,
        newAccount: agentToSessionAccountOrThrow(agent2),
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.currentAgentState.did).toBe('bob-did')

    const anotherTabAgent1 = new BskyAgent({service: 'https://jay.com'})
    anotherTabAgent1.session = {
      did: 'jay-did',
      handle: 'jay.test',
      accessJwt: 'jay-access-jwt-1',
      refreshJwt: 'jay-refresh-jwt-1',
    }
    const anotherTabAgent2 = new BskyAgent({service: 'https://alice.com'})
    anotherTabAgent2.session = {
      did: 'bob-did',
      handle: 'bob.test',
      accessJwt: 'bob-access-jwt-2',
      refreshJwt: 'bob-refresh-jwt-2',
    }
    state = run(state, [
      {
        type: 'synced-accounts',
        syncedAccounts: [
          agentToSessionAccountOrThrow(anotherTabAgent1),
          agentToSessionAccountOrThrow(anotherTabAgent2),
        ],
        syncedCurrentDid: 'bob-did',
      },
    ])
    expect(state.accounts.length).toBe(2)
    expect(state.accounts[0].did).toBe('jay-did')
    expect(state.accounts[1].did).toBe('bob-did')
    expect(state.accounts[1].accessJwt).toBe('bob-access-jwt-2')
    // Keep Bob logged in.
    // (We patch up agent.session outside the reducer for this to work.)
    expect(state.currentAgentState.did).toBe('bob-did')
    expect(state.needsPersist).toBe(false)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "jay-access-jwt-1",
            "deactivated": false,
            "did": "jay-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "jay.test",
            "pdsUrl": undefined,
            "refreshJwt": "jay-refresh-jwt-1",
            "service": "https://jay.com/",
          },
          {
            "accessJwt": "bob-access-jwt-2",
            "deactivated": false,
            "did": "bob-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "bob.test",
            "pdsUrl": undefined,
            "refreshJwt": "bob-refresh-jwt-2",
            "service": "https://alice.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://bob.com/",
          },
          "did": "bob-did",
        },
        "needsPersist": false,
      }
    `)

    const anotherTabAgent3 = new BskyAgent({service: 'https://clarence.com'})
    anotherTabAgent3.session = {
      did: 'clarence-did',
      handle: 'clarence.test',
      accessJwt: 'clarence-access-jwt-2',
      refreshJwt: 'clarence-refresh-jwt-2',
    }
    state = run(state, [
      {
        type: 'synced-accounts',
        syncedAccounts: [agentToSessionAccountOrThrow(anotherTabAgent3)],
        syncedCurrentDid: 'clarence-did',
      },
    ])
    expect(state.accounts.length).toBe(1)
    expect(state.accounts[0].did).toBe('clarence-did')
    // Log out because we have no matching user.
    // (In practice, we'll resume this session outside the reducer.)
    expect(state.currentAgentState.did).toBe(undefined)
    expect(state.needsPersist).toBe(false)
    expect(printState(state)).toMatchInlineSnapshot(`
      {
        "accounts": [
          {
            "accessJwt": "clarence-access-jwt-2",
            "deactivated": false,
            "did": "clarence-did",
            "email": undefined,
            "emailAuthFactor": false,
            "emailConfirmed": false,
            "handle": "clarence.test",
            "pdsUrl": undefined,
            "refreshJwt": "clarence-refresh-jwt-2",
            "service": "https://clarence.com/",
          },
        ],
        "currentAgentState": {
          "agent": {
            "service": "https://public.api.bsky.app/",
          },
          "did": undefined,
        },
        "needsPersist": false,
      }
    `)
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
    currentAgentState: {
      agent: {service: state.currentAgentState.agent.service},
      did: state.currentAgentState.did,
    },
    needsPersist: state.needsPersist,
  }
}

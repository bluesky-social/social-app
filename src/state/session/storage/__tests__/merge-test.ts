import {describe, expect, it} from '@jest/globals'

import {mergeSnapshots} from '../merge'
import {type SessionAccount, type SessionSnapshot} from '../schema'

const alice: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:alice',
  handle: 'alice.test',
  refreshJwt: 'alice-refresh',
  accessJwt: 'alice-access',
  emailConfirmed: false,
}
const bob: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:bob',
  handle: 'bob.test',
  refreshJwt: 'bob-refresh',
  accessJwt: 'bob-access',
}
const charlie: SessionAccount = {
  service: 'https://bsky.social',
  did: 'did:plc:charlie',
  handle: 'charlie.test',
  refreshJwt: 'charlie-refresh',
  accessJwt: 'charlie-access',
}

const {
  refreshJwt: _aliceRefresh,
  accessJwt: _aliceAccess,
  ...loggedOutAlice
} = alice

describe('mergeSnapshots', () => {
  it('folds our field change onto theirs and honors our removal and reorder', () => {
    const base: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const ours: SessionSnapshot = {
      accounts: [{...alice, emailConfirmed: true}],
      currentDid: alice.did,
    }
    const theirs: SessionSnapshot = {
      accounts: [
        {...alice, refreshJwt: 'fresh-refresh', accessJwt: 'fresh-access'},
        bob,
        charlie,
      ],
      currentDid: charlie.did,
    }

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [
        {
          ...alice,
          refreshJwt: 'fresh-refresh',
          accessJwt: 'fresh-access',
          emailConfirmed: true,
        },
        charlie,
      ],
      currentDid: charlie.did,
    })
  })

  it('does not restore a credential another tab revoked', () => {
    const base: SessionSnapshot = {accounts: [alice], currentDid: alice.did}
    const ours: SessionSnapshot = {
      accounts: [
        {...alice, refreshJwt: 'fresh-refresh', accessJwt: 'fresh-access'},
      ],
      currentDid: alice.did,
    }
    const theirs: SessionSnapshot = {
      accounts: [{...alice, refreshJwt: undefined, accessJwt: undefined}],
      currentDid: undefined,
    }

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [loggedOutAlice],
    })
  })

  it('preserves a revocation when we concurrently re-add the account', () => {
    const base: SessionSnapshot = {accounts: [], currentDid: undefined}
    const ours: SessionSnapshot = {accounts: [alice], currentDid: alice.did}
    const theirs: SessionSnapshot = {
      accounts: [loggedOutAlice],
      currentDid: undefined,
    }

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [loggedOutAlice],
      currentDid: alice.did,
    })
  })

  it('takes ours as-is when theirs lacks the account we added', () => {
    const base: SessionSnapshot = {accounts: [bob], currentDid: bob.did}
    const ours: SessionSnapshot = {
      accounts: [bob, alice],
      currentDid: alice.did,
    }
    const theirs: SessionSnapshot = {accounts: [bob], currentDid: bob.did}

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [bob, alice],
      currentDid: alice.did,
    })
  })

  it('lets their removal win over our edit', () => {
    const base: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const ours: SessionSnapshot = {
      accounts: [{...alice, emailConfirmed: true}, bob],
      currentDid: alice.did,
    }
    const theirs: SessionSnapshot = {accounts: [bob], currentDid: bob.did}

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [bob],
      currentDid: bob.did,
    })
  })

  it('drops an account we removed even if theirs still has it', () => {
    const base: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const ours: SessionSnapshot = {accounts: [bob], currentDid: bob.did}
    const theirs: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [bob],
      currentDid: bob.did,
    })
  })

  it('takes theirs entirely for an account we did not touch', () => {
    const base: SessionSnapshot = {accounts: [alice], currentDid: alice.did}
    const ours: SessionSnapshot = {accounts: [alice], currentDid: alice.did}
    const theirs: SessionSnapshot = {
      accounts: [{...alice, handle: 'alice-renamed.test'}],
      currentDid: alice.did,
    }

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [{...alice, handle: 'alice-renamed.test'}],
      currentDid: alice.did,
    })
  })

  it('uses our order when we reordered and appends theirs-only dids', () => {
    const base: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    const ours: SessionSnapshot = {
      accounts: [bob, alice],
      currentDid: bob.did,
    }
    const theirs: SessionSnapshot = {
      accounts: [alice, bob, charlie],
      currentDid: alice.did,
    }

    const merged = mergeSnapshots(base, ours, theirs)
    expect(merged.accounts.map(a => a.did)).toEqual([
      bob.did,
      alice.did,
      charlie.did,
    ])
    expect(merged.currentDid).toBe(bob.did)
  })

  it('clears our currentDid when that account is not in the result', () => {
    const base: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: alice.did,
    }
    // We switch to bob, but another tab removed bob.
    const ours: SessionSnapshot = {
      accounts: [alice, bob],
      currentDid: bob.did,
    }
    const theirs: SessionSnapshot = {accounts: [alice], currentDid: alice.did}

    expect(mergeSnapshots(base, ours, theirs)).toEqual({
      accounts: [alice],
      currentDid: undefined,
    })
  })
})

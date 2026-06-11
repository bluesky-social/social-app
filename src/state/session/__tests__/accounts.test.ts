import {
  getNextAccount,
  resetAccountCycleOrderForTest,
} from '#/state/session/accounts'
import {type SessionAccount} from '#/state/session/types'

function account(did: string): SessionAccount {
  return {
    did,
    service: `https://${did}.test/`,
    handle: `${did}.test`,
    email: undefined,
    emailConfirmed: false,
    emailAuthFactor: false,
    refreshJwt: `${did}-refresh-jwt`,
    accessJwt: `${did}-access-jwt`,
    active: true,
    status: undefined,
    pdsUrl: undefined,
    isSelfHosted: true,
    signupQueued: false,
  }
}

describe('getNextAccount', () => {
  beforeEach(() => {
    resetAccountCycleOrderForTest()
  })

  it('returns undefined without a current account', () => {
    const accounts = [account('alice'), account('bob')]

    expect(getNextAccount(accounts, undefined)).toBeUndefined()
  })

  it('returns undefined when there is only one account', () => {
    const alice = account('alice')

    expect(getNextAccount([alice], alice)).toBeUndefined()
  })

  it('returns the next account in account-list order', () => {
    const alice = account('alice')
    const bob = account('bob')
    const jay = account('jay')

    expect(getNextAccount([alice, bob, jay], alice)).toBe(bob)
    expect(getNextAccount([alice, bob, jay], bob)).toBe(jay)
  })

  it('wraps to the first account', () => {
    const alice = account('alice')
    const bob = account('bob')
    const jay = account('jay')

    expect(getNextAccount([alice, bob, jay], jay)).toBe(alice)
  })

  it('preserves cycle order when the active account moves to the front', () => {
    const alice = account('alice')
    const bob = account('bob')
    const jay = account('jay')

    expect(getNextAccount([alice, bob, jay], alice)).toBe(bob)
    expect(getNextAccount([bob, alice, jay], bob)).toBe(jay)
    expect(getNextAccount([jay, bob, alice], jay)).toBe(alice)
  })
})

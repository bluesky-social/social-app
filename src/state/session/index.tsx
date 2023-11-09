import React from 'react'
import {BskyAgent, AtpPersistSessionHandler} from '@atproto/api'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'

export type SessionAccount = persisted.PersistedAccount

export type StateContext = {
  isInitialLoad: boolean
  agent: BskyAgent
  accounts: persisted.PersistedAccount[]
  currentAccount: persisted.PersistedAccount | undefined
  hasSession: boolean
}
export type ApiContext = {
  createAccount: (props: {
    service: string
    email: string
    password: string
    handle: string
    inviteCode?: string
  }) => Promise<void>
  login: (props: {
    service: string
    identifier: string
    password: string
  }) => Promise<void>
  logout: () => Promise<void>
  initSession: (account: persisted.PersistedAccount) => Promise<void>
  resumeSession: (account?: persisted.PersistedAccount) => Promise<void>
  removeAccount: (
    account: Partial<Pick<persisted.PersistedAccount, 'handle' | 'did'>>,
  ) => void
  updateCurrentAccount: (
    account: Pick<persisted.PersistedAccount, 'handle'>,
  ) => void
}

export const PUBLIC_BSKY_AGENT = new BskyAgent({
  service: 'https://api.bsky.app',
})

const StateContext = React.createContext<StateContext>({
  hasSession: false,
  isInitialLoad: true,
  accounts: [],
  currentAccount: undefined,
  agent: PUBLIC_BSKY_AGENT,
})

const ApiContext = React.createContext<ApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logout: async () => {},
  initSession: async () => {},
  resumeSession: async () => {},
  removeAccount: () => {},
  updateCurrentAccount: () => {},
})

function createPersistSessionHandler(
  account: persisted.PersistedAccount,
  persistSessionCallback: (props: {
    expired: boolean
    refreshedAccount: persisted.PersistedAccount
  }) => void,
): AtpPersistSessionHandler {
  return function persistSession(event, session) {
    const expired = !(event === 'create' || event === 'update')
    const refreshedAccount = {
      service: account.service,
      did: session?.did || account.did,
      handle: session?.handle || account.handle,
      refreshJwt: session?.refreshJwt, // undefined when expired or creation fails
      accessJwt: session?.accessJwt, // undefined when expired or creation fails
    }

    logger.debug(`session: BskyAgent.persistSession`, {
      expired,
      did: refreshedAccount.did,
      handle: refreshedAccount.handle,
    })

    persistSessionCallback({
      expired,
      refreshedAccount,
    })
  }
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState<StateContext>({
    hasSession: false,
    isInitialLoad: true, // try to resume the session first
    accounts: persisted.get('session').accounts,
    currentAccount: undefined, // assume logged out to start
    agent: PUBLIC_BSKY_AGENT,
  })

  const upsertAccount = React.useCallback(
    (account: persisted.PersistedAccount, expired = false) => {
      setState(s => {
        return {
          ...s,
          currentAccount: expired ? undefined : account,
          accounts: [account, ...s.accounts.filter(a => a.did !== account.did)],
        }
      })
    },
    [setState],
  )

  // TODO have not connected this yet
  const createAccount = React.useCallback<ApiContext['createAccount']>(
    async ({service, email, password, handle, inviteCode}: any) => {
      logger.debug(`session: creating account`, {
        service,
        handle,
      })

      const agent = new BskyAgent({service})

      await agent.createAccount({
        handle,
        password,
        email,
        inviteCode,
      })

      if (!agent.session) {
        throw new Error(`session: createAccount failed to establish a session`)
      }

      const account: persisted.PersistedAccount = {
        service,
        did: agent.session.did,
        refreshJwt: agent.session.refreshJwt,
        accessJwt: agent.session.accessJwt,
        handle: agent.session.handle,
      }

      agent.setPersistSessionHandler(
        createPersistSessionHandler(account, ({expired, refreshedAccount}) => {
          upsertAccount(refreshedAccount, expired)
        }),
      )

      upsertAccount(account)

      logger.debug(`session: created account`, {
        service,
        handle,
      })
    },
    [upsertAccount],
  )

  const login = React.useCallback<ApiContext['login']>(
    async ({service, identifier, password}) => {
      logger.debug(`session: login`, {
        service,
        identifier,
      })

      const agent = new BskyAgent({service})

      await agent.login({identifier, password})

      if (!agent.session) {
        throw new Error(`session: login failed to establish a session`)
      }

      const account: persisted.PersistedAccount = {
        service,
        did: agent.session.did,
        refreshJwt: agent.session.refreshJwt,
        accessJwt: agent.session.accessJwt,
        handle: agent.session.handle,
      }

      agent.setPersistSessionHandler(
        createPersistSessionHandler(account, ({expired, refreshedAccount}) => {
          upsertAccount(refreshedAccount, expired)
        }),
      )

      setState(s => ({...s, agent}))
      upsertAccount(account)

      logger.debug(`session: logged in`, {
        service,
        identifier,
      })
    },
    [upsertAccount],
  )

  const logout = React.useCallback<ApiContext['logout']>(async () => {
    logger.debug(`session: logout`)
    setState(s => {
      return {
        ...s,
        agent: PUBLIC_BSKY_AGENT,
        currentAccount: undefined,
        accounts: s.accounts.map(a => ({
          ...a,
          refreshJwt: undefined,
          accessJwt: undefined,
        })),
      }
    })
  }, [setState])

  const initSession = React.useCallback<ApiContext['initSession']>(
    async account => {
      logger.debug(`session: initSession`, {
        did: account.did,
        handle: account.handle,
      })

      const agent = new BskyAgent({
        service: account.service,
        persistSession: createPersistSessionHandler(
          account,
          ({expired, refreshedAccount}) => {
            upsertAccount(refreshedAccount, expired)
          },
        ),
      })

      await networkRetry(3, () =>
        agent.resumeSession({
          accessJwt: account.accessJwt || '',
          refreshJwt: account.refreshJwt || '',
          did: account.did,
          handle: account.handle,
        }),
      )

      setState(s => ({...s, agent}))
      upsertAccount(account)
    },
    [upsertAccount],
  )

  const resumeSession = React.useCallback<ApiContext['resumeSession']>(
    async account => {
      try {
        if (account) {
          await initSession(account)
        }
      } catch (e) {
        logger.error(`session: resumeSession failed`, {error: e})
      } finally {
        setState(s => ({
          ...s,
          isInitialLoad: false,
        }))
      }
    },
    [initSession],
  )

  const removeAccount = React.useCallback<ApiContext['removeAccount']>(
    account => {
      setState(s => {
        return {
          ...s,
          accounts: s.accounts.filter(
            a => !(a.did === account.did || a.handle === account.handle),
          ),
        }
      })
    },
    [setState],
  )

  const updateCurrentAccount = React.useCallback<
    ApiContext['updateCurrentAccount']
  >(
    account => {
      setState(s => {
        const currentAccount = s.currentAccount

        // ignore, should never happen
        if (!currentAccount) return s

        const updatedAccount = {
          ...currentAccount,
          handle: account.handle, // only update handle rn
        }

        return {
          ...s,
          currentAccount: updatedAccount,
          accounts: s.accounts.filter(a => a.did !== currentAccount.did),
        }
      })
    },
    [setState],
  )

  React.useEffect(() => {
    persisted.write('session', {
      accounts: state.accounts,
      currentAccount: state.currentAccount,
    })
  }, [state])

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      const session = persisted.get('session')

      logger.debug(`session: onUpdate`)

      if (session.currentAccount) {
        if (session.currentAccount?.did !== state.currentAccount?.did) {
          logger.debug(`session: switching account`, {
            from: {
              did: state.currentAccount?.did,
              handle: state.currentAccount?.handle,
            },
            to: {
              did: session.currentAccount.did,
              handle: session.currentAccount.handle,
            },
          })

          initSession(session.currentAccount)
        }
      } else if (!session.currentAccount && state.currentAccount) {
        logger.debug(`session: logging out`, {
          did: state.currentAccount?.did,
          handle: state.currentAccount?.handle,
        })

        logout()
      }
    })
  }, [state, logout, initSession])

  const stateContext = React.useMemo(
    () => ({
      ...state,
      hasSession: !!state.currentAccount,
    }),
    [state],
  )

  const api = React.useMemo(
    () => ({
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
      updateCurrentAccount,
    }),
    [
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
      updateCurrentAccount,
    ],
  )

  return (
    <StateContext.Provider value={stateContext}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useSession() {
  return React.useContext(StateContext)
}

export function useSessionApi() {
  return React.useContext(ApiContext)
}

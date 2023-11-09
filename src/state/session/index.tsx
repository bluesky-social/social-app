import React from 'react'
import {BskyAgent, AtpPersistSessionHandler} from '@atproto/api'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'

type Account = Exclude<StateContext['currentAccount'], undefined>

type StateContext = {
  isInitialLoad: boolean
  agent: BskyAgent
  accounts: persisted.Schema['session']['accounts']
  currentAccount: persisted.Schema['session']['currentAccount']
}
type ApiContext = {
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
  initSession: (account: Account) => Promise<void>
  resumeSession: (account?: Account) => Promise<void>
  removeAccount: (account: Account) => void
}

export const PUBLIC_BSKY_AGENT = new BskyAgent({
  service: 'https://api.bsky.app',
})

const StateContext = React.createContext<StateContext>({
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
})

function createPersistSessionHandler(
  account: Account,
  persistSessionCallback: (props: {
    expired: boolean
    refreshedAccount: Account
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
    isInitialLoad: true, // try to resume the session first
    accounts: persisted.get('session').accounts,
    currentAccount: undefined, // assume logged out to start
    agent: PUBLIC_BSKY_AGENT,
  })

  const setStateWrapped = React.useCallback(
    (fn: (prev: StateContext) => StateContext) => {
      let next: StateContext | undefined
      setState(s => {
        next = fn(s)
        return next
      })

      // just for TypeScript
      if (!next) return

      // only some state should be persisted
      persisted.write('session', {
        accounts: next.accounts,
        currentAccount: next.currentAccount,
      })
    },
    [setState],
  )

  const upsertAccount = React.useCallback(
    (account: Account, expired = false) => {
      setStateWrapped(s => {
        return {
          ...s,
          currentAccount: expired ? undefined : account,
          accounts: [account, ...s.accounts.filter(a => a.did !== account.did)],
        }
      })
    },
    [setStateWrapped],
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

      const account: Account = {
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

      const account: Account = {
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

      logger.debug(`session: logged in`, {
        service,
        identifier,
      })
    },
    [upsertAccount],
  )

  const logout = React.useCallback<ApiContext['logout']>(async () => {
    setStateWrapped(s => {
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
  }, [setStateWrapped])

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
      setStateWrapped(s => {
        return {
          ...s,
          accounts: s.accounts.filter(a => a.did !== account.did),
        }
      })
    },
    [setStateWrapped],
  )

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

  // TODO reloadFromServer, RQ?
  // TODO updateLocalAccountData, RQ?

  const api = React.useMemo(
    () => ({
      createAccount,
      login,
      logout,
      initSession,
      resumeSession,
      removeAccount,
    }),
    [createAccount, login, logout, initSession, resumeSession, removeAccount],
  )

  return (
    <StateContext.Provider value={state}>
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

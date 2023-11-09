import React from 'react'
import {BskyAgent, AtpPersistSessionHandler} from '@atproto/api'

import {networkRetry} from '#/lib/async/retry'
import {logger} from '#/logger'
import * as persisted from '#/state/persisted'

type Account = Exclude<StateContext['currentAccount'], undefined>

type StateContext = {
  isResumingSession: boolean
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
  resumeSession: () => Promise<void>
}

export const BSKY_AGENT = new BskyAgent({
  service: 'https://api.bsky.app',
})

const StateContext = React.createContext<StateContext>({
  isResumingSession: false,
  accounts: [],
  currentAccount: undefined,
  agent: BSKY_AGENT,
})

const ApiContext = React.createContext<ApiContext>({
  createAccount: async () => {},
  login: async () => {},
  logout: async () => {},
  resumeSession: async () => {},
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

    logger.info(`session: BskyAgent.persistSession`, {
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
  const initialSession = React.useMemo(() => persisted.get('session'), [])
  const [state, setState] = React.useState({
    isResumingSession: false,
    accounts: initialSession.accounts,
    currentAccount: initialSession.currentAccount,
    agent: BSKY_AGENT,
  })

  const setStateWrapped = React.useCallback(
    (fn: (prev: StateContext) => StateContext) => {
      let next: StateContext = state
      setState(s => {
        next = fn(s)
        return next
      })
      // only some state should be persisted
      persisted.write('session', {
        accounts: next.accounts,
        currentAccount: next.currentAccount,
      })
    },
    [state, setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(() => {
      const session = persisted.get('session')
      setStateWrapped(s => ({
        ...s,
        accounts: session.accounts,
        currentAccount: session.currentAccount,
      }))
    })
  }, [setStateWrapped])

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

  const createAccount = React.useCallback<ApiContext['createAccount']>(
    async ({service, email, password, handle, inviteCode}: any) => {
      logger.info(`session: creating account`, {
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

      logger.info(`session: created account`, {
        service,
        handle,
      })
    },
    [upsertAccount],
  )

  const login = React.useCallback<ApiContext['login']>(
    async ({service, identifier, password}) => {
      logger.info(`session: login`, {
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

      logger.info(`session: logged in`, {
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
        agent: BSKY_AGENT,
        currentAccount: undefined,
        accounts: s.accounts.map(a => ({
          ...a,
          refreshJwt: undefined,
          accessJwt: undefined,
        })),
      }
    })
  }, [setStateWrapped])

  const resumeSession = React.useCallback<
    ApiContext['resumeSession']
  >(async () => {
    const account = state.currentAccount

    if (!account) return

    // TODO don't love this
    setState(s => ({...s, isResumingSession: true}))

    logger.info(`session: resumeSession`, {
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

    setState(s => ({...s, isResumingSession: false}))
  }, [state, setState, upsertAccount])

  // TODO handle cross-tab
  // TODO removeAccount
  // TODO reloadFromServer
  // TODO updateLocalAccountData

  const api = React.useMemo(
    () => ({
      createAccount,
      login,
      logout,
      resumeSession,
    }),
    [createAccount, login, logout, resumeSession],
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

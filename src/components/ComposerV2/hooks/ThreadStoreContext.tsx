import {createContext, useContext} from 'react'

import {type createThreadStore} from '#/components/ComposerV2/store'

export type ThreadStore = ReturnType<typeof createThreadStore>

const ThreadStoreContext = createContext<ThreadStore | null>(null)

export function ThreadStoreProvider({
  store,
  children,
}: {
  store: ThreadStore
  children: React.ReactNode
}) {
  return (
    <ThreadStoreContext.Provider value={store}>
      {children}
    </ThreadStoreContext.Provider>
  )
}

export function useThreadStore(): ThreadStore {
  const store = useContext(ThreadStoreContext)
  if (!store) {
    throw new Error(
      'useThreadStore must be used inside a <ThreadStoreProvider>',
    )
  }
  return store
}

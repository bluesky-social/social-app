import {createContext, useContext} from 'react'

import {
  type createPostThreadOtherQueryKey,
  type createPostThreadQueryKey,
} from '#/state/queries/usePostThread/types'

/**
 * Contains static metadata about the post thread query, suitable for
 * context e.g. query keys and other things that don't update frequently.
 *
 * Be careful adding things here, as it could cause unnecessary re-renders.
 */
export type PostThreadContextType = {
  postThreadQueryKey: ReturnType<typeof createPostThreadQueryKey>
  postThreadOtherQueryKey: ReturnType<typeof createPostThreadOtherQueryKey>
}

const PostThreadContext = createContext<PostThreadContextType | undefined>(
  undefined,
)

/**
 * Use the current {@link PostThreadContext}, if one is available. If not,
 * returns `undefined`.
 */
export function usePostThreadContext() {
  return useContext(PostThreadContext)
}

export function PostThreadContextProvider({
  children,
  context,
}: {
  children: React.ReactNode
  context?: PostThreadContextType
}) {
  return (
    <PostThreadContext.Provider value={context}>
      {children}
    </PostThreadContext.Provider>
  )
}

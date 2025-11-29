import {AtUri} from '@atproto/api'
import {
  type QueryClient,
  type QueryFunctionContext,
  useInfiniteQuery as useTanstackInfiniteQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  useQuery as useTanstackQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'

import {useSession} from '#/state/session'
import {
  buildSyntheticFeedPage,
  buildSyntheticPostView,
  buildSyntheticProfileView,
  isAppViewError,
  resolveIdentityViaSlingshot,
} from './microcosm-fallback'

/**
 * Extended query options that include fallback configuration
 */
export interface UseQueryWithFallbackOptions<TData, TError>
  extends UseQueryOptions<TData, TError> {
  /**
   * Enable automatic fallback to PDS + Microcosm on AppView errors
   * @default true for profile/post queries, false otherwise
   */
  enableFallback?: boolean

  /**
   * Type of query for fallback (helps determine how to reconstruct data)
   * @default 'generic'
   */
  fallbackType?: 'profile' | 'post' | 'thread' | 'feed' | 'generic'

  /**
   * AT URI or DID to use for fallback (extracted from queryKey if not provided)
   */
  fallbackIdentifier?: string
}

/**
 * Extended infinite query options that include fallback configuration
 */
export interface UseInfiniteQueryWithFallbackOptions<TData, TError, TPageParam>
  extends UseInfiniteQueryOptions<
    TData,
    TError,
    TData,
    TData,
    any,
    TPageParam
  > {
  /**
   * Enable automatic fallback to PDS + Microcosm on AppView errors
   * @default false
   */
  enableFallback?: boolean

  /**
   * Type of query for fallback (helps determine how to reconstruct data)
   * @default 'generic'
   */
  fallbackType?: 'profile' | 'post' | 'thread' | 'feed' | 'generic'

  /**
   * AT URI or DID to use for fallback (extracted from queryKey if not provided)
   */
  fallbackIdentifier?: string
}

/**
 * Custom useQuery hook with automatic PDS + Microcosm fallback
 *
 * Wraps TanStack Query's useQuery and adds fallback logic:
 * 1. Tries original queryFn (hits AppView)
 * 2. On AppView errors, attempts Slingshot + Constellation fallback
 * 3. Returns synthetic data compatible with AppView format
 *
 * @example
 * ```typescript
 * export function useProfileQuery({did}) {
 *   const agent = useAgent()
 *   return useQuery({
 *     queryKey: ['profile', did],
 *     queryFn: async () => {
 *       const res = await agent.getProfile({actor: did})
 *       return res.data
 *     },
 *     enableFallback: true,
 *     fallbackType: 'profile',
 *     fallbackIdentifier: did,
 *   })
 * }
 * ```
 */
export function useQuery<TData = unknown, TError = Error>(
  options: UseQueryWithFallbackOptions<TData, TError>,
): UseQueryResult<TData, TError> {
  const {
    queryFn,
    enableFallback = false,
    fallbackType = 'generic',
    fallbackIdentifier,
    ...restOptions
  } = options

  const queryClient = useQueryClient()
  const {hasSession} = useSession()

  // Wrap the original queryFn with fallback logic
  const wrappedQueryFn: typeof queryFn = async context => {
    if (!queryFn) return undefined as TData

    try {
      // Try the original query function (AppView)
      return await queryFn(context)
    } catch (error: any) {
      // If fallback is disabled or this isn't an AppView error, re-throw
      if (!enableFallback || !isAppViewError(error)) {
        throw error
      }

      // SECURITY: Do NOT trigger fallback for logged-out users
      // This prevents bypassing AppView access controls like logged-out visibility settings
      if (!hasSession) {
        console.log(
          '[Fallback] Skipping fallback for logged-out user (respecting access controls)',
        )
        throw error
      }

      console.log('[Fallback] Attempting PDS + Microcosm fallback:', {
        fallbackType,
        fallbackIdentifier,
        error: error.message,
      })

      // Extract identifier from queryKey if not provided
      const identifier =
        fallbackIdentifier ||
        extractIdentifierFromQueryKey(context.queryKey as unknown[])

      if (!identifier) {
        console.error('[Fallback] No identifier found for fallback')
        throw error
      }

      // Attempt fallback based on query type
      try {
        const fallbackData = await attemptFallback(
          queryClient,
          fallbackType,
          identifier,
        )

        if (!fallbackData) {
          throw error // Fallback failed, re-throw original error
        }

        console.log(
          '[Fallback] Successfully retrieved data via PDS + Microcosm',
        )
        return fallbackData as TData
      } catch (fallbackError) {
        console.error('[Fallback] Failed:', fallbackError)
        throw error // Fallback failed, re-throw original error
      }
    }
  }

  // Use the wrapped queryFn with TanStack Query
  return useTanstackQuery({
    ...restOptions,
    queryFn: wrappedQueryFn,
  })
}

/**
 * Custom useInfiniteQuery hook with automatic PDS + Microcosm fallback
 *
 * Wraps TanStack Query's useInfiniteQuery and adds fallback logic for paginated queries.
 * This is essential for feeds, followers, following lists, and other infinite scroll features.
 *
 * @example
 * ```typescript
 * export function usePostFeedQuery({did}) {
 *   const agent = useAgent()
 *   return useInfiniteQuery({
 *     queryKey: ['post-feed', did],
 *     queryFn: async ({pageParam}) => {
 *       const res = await agent.getAuthorFeed({actor: did, cursor: pageParam})
 *       return res.data
 *     },
 *     initialPageParam: undefined,
 *     getNextPageParam: (lastPage) => lastPage.cursor,
 *     enableFallback: true,
 *     fallbackType: 'feed',
 *     fallbackIdentifier: did,
 *   })
 * }
 * ```
 */
export function useInfiniteQuery<
  TData = unknown,
  TError = Error,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryWithFallbackOptions<TData, TError, TPageParam>,
): UseInfiniteQueryResult<TData, TError> {
  const {
    queryFn,
    enableFallback = false,
    fallbackType = 'generic',
    fallbackIdentifier,
    ...restOptions
  } = options

  const queryClient = useQueryClient()
  const {hasSession} = useSession()

  // Wrap the original queryFn with fallback logic
  const wrappedQueryFn = async (
    context: QueryFunctionContext<any, TPageParam>,
  ) => {
    if (!queryFn) return undefined as TData

    try {
      // Try the original query function (AppView)
      return await queryFn(context)
    } catch (error: any) {
      // If fallback is disabled or this isn't an AppView error, re-throw
      if (!enableFallback || !isAppViewError(error)) {
        throw error
      }

      // SECURITY: Do NOT trigger fallback for logged-out users
      // This prevents bypassing AppView access controls like logged-out visibility settings
      if (!hasSession) {
        console.log(
          '[Fallback] Skipping fallback for logged-out user (respecting access controls)',
        )
        throw error
      }

      const pageParam = 'pageParam' in context ? context.pageParam : undefined

      console.log(
        '[Fallback] Attempting PDS + Microcosm fallback (infinite):',
        {
          fallbackType,
          fallbackIdentifier,
          pageParam,
          error: error.message,
        },
      )

      // Extract identifier from queryKey if not provided
      const identifier =
        fallbackIdentifier ||
        extractIdentifierFromQueryKey(context.queryKey as unknown[])

      if (!identifier) {
        console.error('[Fallback] No identifier found for fallback')
        throw error
      }

      // Attempt fallback based on query type
      try {
        const fallbackData = await attemptInfiniteFallback(
          queryClient,
          fallbackType,
          identifier,
          pageParam as string | undefined,
        )

        if (!fallbackData) {
          throw error // Fallback failed, re-throw original error
        }

        console.log(
          '[Fallback] Successfully retrieved paginated data via PDS + Microcosm',
        )
        return fallbackData as TData
      } catch (fallbackError) {
        console.error('[Fallback] Failed:', fallbackError)
        throw error // Fallback failed, re-throw original error
      }
    }
  }

  // Use the wrapped queryFn with TanStack Query
  return useTanstackInfiniteQuery({
    ...restOptions,
    queryFn: wrappedQueryFn,
  })
}

/**
 * Extract DID/handle/URI from query key
 */
function extractIdentifierFromQueryKey(queryKey: unknown[]): string | null {
  // Query keys typically look like: ['profile', did] or ['post', uri]
  if (Array.isArray(queryKey) && queryKey.length >= 2) {
    const identifier = queryKey[1]
    if (typeof identifier === 'string') {
      return identifier
    }
  }
  return null
}

/**
 * Attempt to fetch data using PDS + Microcosm fallback
 */
async function attemptFallback(
  queryClient: QueryClient,
  type: string,
  identifier: string,
): Promise<any> {
  switch (type) {
    case 'profile': {
      // identifier is a DID or handle
      const identity = await resolveIdentityViaSlingshot(identifier)
      if (!identity) return null

      return await buildSyntheticProfileView(
        queryClient,
        identity.did,
        identity.handle,
      )
    }

    case 'post': {
      // identifier is an AT URI
      const urip = new AtUri(identifier)
      const identity = await resolveIdentityViaSlingshot(urip.host)
      if (!identity) return null

      return await buildSyntheticPostView(
        queryClient,
        identifier,
        identity.did,
        identity.handle,
      )
    }

    case 'thread': {
      // For threads, fetch the root post and build thread structure
      const urip = new AtUri(identifier)
      const identity = await resolveIdentityViaSlingshot(urip.host)
      if (!identity) return null

      const post = await buildSyntheticPostView(
        queryClient,
        identifier,
        identity.did,
        identity.handle,
      )

      // Return thread structure with single post
      return {
        type: 'post',
        post,
        parent: undefined,
        replies: [],
      }
    }

    default:
      // Generic fallback not supported
      return null
  }
}

/**
 * Attempt to fetch paginated data using PDS + Microcosm fallback
 * This is used by useInfiniteQuery for feeds, followers, etc.
 */
async function attemptInfiniteFallback(
  queryClient: QueryClient,
  type: string,
  identifier: string,
  cursor?: string,
): Promise<any> {
  switch (type) {
    case 'feed': {
      // identifier is a DID - fetch author feed from PDS
      const identity = await resolveIdentityViaSlingshot(identifier)
      if (!identity) return null

      return await buildSyntheticFeedPage(
        queryClient,
        identity.did,
        identity.pds,
        cursor,
      )
    }

    case 'profile':
    case 'post':
    case 'thread': {
      // These types don't support pagination in fallback mode
      // Return empty page to gracefully handle the error
      return {
        feed: [],
        cursor: undefined,
      }
    }

    default:
      // Generic fallback not supported
      return null
  }
}

/**
 * Fetch query data with automatic PDS + Microcosm fallback
 *
 * This is the fetch equivalent of useQuery with fallback support.
 * Used for imperatively fetching data when you need the result immediately.
 *
 * @example
 * ```typescript
 * const post = await fetchQueryWithFallback(queryClient, {
 *   queryKey: RQKEY(uri),
 *   queryFn: async () => {
 *     const res = await agent.getPosts({uris: [uri]})
 *     return res.data.posts[0]
 *   },
 *   enableFallback: true,
 *   fallbackType: 'post',
 *   fallbackIdentifier: uri,
 * })
 * ```
 */
export async function fetchQueryWithFallback<TData = unknown, TError = Error>(
  queryClient: QueryClient,
  options: UseQueryWithFallbackOptions<TData, TError>,
): Promise<TData> {
  const {
    queryFn,
    enableFallback = false,
    fallbackType = 'generic',
    fallbackIdentifier,
    queryKey,
    ...restOptions
  } = options

  // Wrap the original queryFn with fallback logic
  const wrappedQueryFn = async (context: QueryFunctionContext) => {
    if (!queryFn) return undefined as TData

    try {
      // Try the original query function (AppView)
      return await queryFn(context)
    } catch (error: any) {
      // If fallback is disabled or this isn't an AppView error, re-throw
      if (!enableFallback || !isAppViewError(error)) {
        throw error
      }

      console.log('[Fallback] Attempting PDS + Microcosm fallback (fetch):', {
        fallbackType,
        fallbackIdentifier,
        error: error.message,
      })

      // Extract identifier from queryKey if not provided
      const identifier =
        fallbackIdentifier ||
        extractIdentifierFromQueryKey(context.queryKey as unknown[])

      if (!identifier) {
        console.error('[Fallback] No identifier found for fallback')
        throw error
      }

      // Attempt fallback based on query type
      try {
        const fallbackData = await attemptFallback(
          queryClient,
          fallbackType,
          identifier,
        )

        if (!fallbackData) {
          throw error // Fallback failed, re-throw original error
        }

        console.log(
          '[Fallback] Successfully retrieved data via PDS + Microcosm (fetch)',
        )
        return fallbackData as TData
      } catch (fallbackError) {
        console.error('[Fallback] Failed:', fallbackError)
        throw error // Fallback failed, re-throw original error
      }
    }
  }

  // Use the wrapped queryFn with TanStack Query's fetchQuery
  return await queryClient.fetchQuery({
    ...restOptions,
    queryKey,
    queryFn: wrappedQueryFn,
  })
}

/**
 * Prefetch query data with automatic PDS + Microcosm fallback
 *
 * This is the prefetch equivalent of useQuery with fallback support.
 * Used for pre-loading data before it's needed (e.g., on hover interactions).
 *
 * @example
 * ```typescript
 * export function usePrefetchProfileQuery() {
 *   const agent = useAgent()
 *   const queryClient = useQueryClient()
 *   const prefetchProfileQuery = useCallback(
 *     async (did: string) => {
 *       await prefetchQueryWithFallback(queryClient, {
 *         staleTime: STALE.SECONDS.THIRTY,
 *         queryKey: RQKEY(did),
 *         queryFn: async () => {
 *           const res = await agent.getProfile({actor: did || ''})
 *           return res.data
 *         },
 *         enableFallback: true,
 *         fallbackType: 'profile',
 *         fallbackIdentifier: did,
 *       })
 *     },
 *     [queryClient, agent],
 *   )
 *   return prefetchProfileQuery
 * }
 * ```
 */
export async function prefetchQueryWithFallback<
  TData = unknown,
  TError = Error,
>(
  queryClient: QueryClient,
  options: UseQueryWithFallbackOptions<TData, TError>,
): Promise<void> {
  const {
    queryFn,
    enableFallback = false,
    fallbackType = 'generic',
    fallbackIdentifier,
    queryKey,
    ...restOptions
  } = options

  // Wrap the original queryFn with fallback logic
  const wrappedQueryFn = async (context: QueryFunctionContext) => {
    if (!queryFn) return undefined as TData

    try {
      // Try the original query function (AppView)
      return await queryFn(context)
    } catch (error: any) {
      // If fallback is disabled or this isn't an AppView error, re-throw
      if (!enableFallback || !isAppViewError(error)) {
        throw error
      }

      console.log(
        '[Fallback] Attempting PDS + Microcosm fallback (prefetch):',
        {
          fallbackType,
          fallbackIdentifier,
          error: error.message,
        },
      )

      // Extract identifier from queryKey if not provided
      const identifier =
        fallbackIdentifier ||
        extractIdentifierFromQueryKey(context.queryKey as unknown[])

      if (!identifier) {
        console.error('[Fallback] No identifier found for fallback')
        throw error
      }

      // Attempt fallback based on query type
      try {
        const fallbackData = await attemptFallback(
          queryClient,
          fallbackType,
          identifier,
        )

        if (!fallbackData) {
          throw error // Fallback failed, re-throw original error
        }

        console.log(
          '[Fallback] Successfully retrieved data via PDS + Microcosm (prefetch)',
        )
        return fallbackData as TData
      } catch (fallbackError) {
        console.error('[Fallback] Failed:', fallbackError)
        throw error // Fallback failed, re-throw original error
      }
    }
  }

  // Use the wrapped queryFn with TanStack Query's prefetchQuery
  await queryClient.prefetchQuery({
    ...restOptions,
    queryKey,
    queryFn: wrappedQueryFn,
  })
}

// Re-export other hooks and utilities from TanStack Query for convenience
export {
  type InfiniteData,
  keepPreviousData,
  type QueryClient,
  type QueryKey,
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'

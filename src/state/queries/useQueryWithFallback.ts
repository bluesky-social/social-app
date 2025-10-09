

import {
  useQuery as useTanstackQuery,
  useInfiniteQuery as useTanstackInfiniteQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type QueryFunctionContext,
} from '@tanstack/react-query'
import {AtUri} from '@atproto/api'
import {
  isAppViewError,
  resolveIdentityViaSlingshot,
  buildSyntheticProfileView,
  buildSyntheticPostView,
  buildSyntheticFeedPage,
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
  extends UseInfiniteQueryOptions<TData, TError, TData, TData, any, TPageParam> {
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
  options: UseQueryWithFallbackOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const {
    queryFn,
    enableFallback = false,
    fallbackType = 'generic',
    fallbackIdentifier,
    ...restOptions
  } = options

  // Wrap the original queryFn with fallback logic
  const wrappedQueryFn: typeof queryFn = async (context) => {
    if (!queryFn) return undefined as TData

    try {
      // Try the original query function (AppView)
      return await queryFn(context)
    } catch (error: any) {
      // If fallback is disabled or this isn't an AppView error, re-throw
      if (!enableFallback || !isAppViewError(error)) {
        throw error
      }

      console.log('[Fallback] Attempting PDS + Microcosm fallback:', {
        fallbackType,
        fallbackIdentifier,
        error: error.message,
      })

      // Extract identifier from queryKey if not provided
      const identifier = fallbackIdentifier || extractIdentifierFromQueryKey(context.queryKey)

      if (!identifier) {
        console.error('[Fallback] No identifier found for fallback')
        throw error
      }

      // Attempt fallback based on query type
      try {
        const fallbackData = await attemptFallback(
          fallbackType,
          identifier
        )

        if (!fallbackData) {
          throw error // Fallback failed, re-throw original error
        }

        console.log('[Fallback] Successfully retrieved data via PDS + Microcosm')
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
  TPageParam = unknown
>(
  options: UseInfiniteQueryWithFallbackOptions<TData, TError, TPageParam>
): UseInfiniteQueryResult<TData, TError> {
  const {
    queryFn,
    enableFallback = false,
    fallbackType = 'generic',
    fallbackIdentifier,
    ...restOptions
  } = options

  // Wrap the original queryFn with fallback logic
  const wrappedQueryFn = async (context: QueryFunctionContext<any, TPageParam>) => {
    if (!queryFn) return undefined as TData

    try {
      // Try the original query function (AppView)
      return await queryFn(context)
    } catch (error: any) {
      // If fallback is disabled or this isn't an AppView error, re-throw
      if (!enableFallback || !isAppViewError(error)) {
        throw error
      }

      console.log('[Fallback] Attempting PDS + Microcosm fallback (infinite):', {
        fallbackType,
        fallbackIdentifier,
        pageParam: context.pageParam,
        error: error.message,
      })

      // Extract identifier from queryKey if not provided
      const identifier = fallbackIdentifier || extractIdentifierFromQueryKey(context.queryKey)

      if (!identifier) {
        console.error('[Fallback] No identifier found for fallback')
        throw error
      }

      // Attempt fallback based on query type
      try {
        const fallbackData = await attemptInfiniteFallback(
          fallbackType,
          identifier,
          context.pageParam as string | undefined
        )

        if (!fallbackData) {
          throw error // Fallback failed, re-throw original error
        }

        console.log('[Fallback] Successfully retrieved paginated data via PDS + Microcosm')
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
  type: string,
  identifier: string
): Promise<any> {
  switch (type) {
    case 'profile': {
      // identifier is a DID or handle
      const identity = await resolveIdentityViaSlingshot(identifier)
      if (!identity) return null

      return await buildSyntheticProfileView(identity.did, identity.handle)
    }

    case 'post': {
      // identifier is an AT URI
      const urip = new AtUri(identifier)
      const identity = await resolveIdentityViaSlingshot(urip.host)
      if (!identity) return null

      return await buildSyntheticPostView(
        identifier,
        identity.did,
        identity.handle
      )
    }

    case 'thread': {
      // For threads, fetch the root post and build thread structure
      const urip = new AtUri(identifier)
      const identity = await resolveIdentityViaSlingshot(urip.host)
      if (!identity) return null

      const post = await buildSyntheticPostView(
        identifier,
        identity.did,
        identity.handle
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
  type: string,
  identifier: string,
  cursor?: string
): Promise<any> {
  switch (type) {
    case 'feed': {
      // identifier is a DID - fetch author feed from PDS
      const identity = await resolveIdentityViaSlingshot(identifier)
      if (!identity) return null

      return await buildSyntheticFeedPage(
        identity.did,
        identity.pds,
        cursor
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

// Re-export other hooks from TanStack Query for convenience
export {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'

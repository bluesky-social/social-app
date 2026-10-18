import {useEffect, useRef, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import * as Toast from '#/components/Toast'

export type IncrementalSlice = {items: readonly unknown[]} & (
  {key: string} | {_reactKey: string}
)

type FetchResult<TData> = {
  isError: boolean
  hasNextPage?: boolean
  data?: TData
}

/** Reveals complete slices without changing the underlying query or its cache. */
export function useIncrementalList<TData, TSlice extends IncrementalSlice>({
  enabled,
  active = true,
  batchSize,
  slices,
  slicesFromData,
  resetKey,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  isError,
  fetchNextPage,
  getItemCount = (slice: TSlice) => slice.items.length,
}: {
  enabled: boolean
  active?: boolean
  batchSize: number
  slices: TSlice[]
  slicesFromData: (data: TData | undefined) => TSlice[]
  getItemCount?: (slice: TSlice) => number
  resetKey: string
  hasNextPage: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  isError: boolean
  fetchNextPage: (opts?: {
    cancelRefetch?: boolean
  }) => Promise<FetchResult<TData>>
}) {
  const {t: l} = useLingui()
  const [resetVersion, setResetVersion] = useState(0)
  const scope = JSON.stringify([resetKey, enabled, batchSize, resetVersion])
  const [window, setWindow] = useState({scope, count: batchSize, endKey: ''})
  const [loadingScope, setLoadingScope] = useState<string>()
  const requestRef = useRef<{cancelled: boolean} | undefined>(undefined)
  const initialFillRef = useRef<string | undefined>(undefined)

  if (window.scope !== scope) {
    setWindow({scope, count: batchSize, endKey: ''})
  }

  const previousEnd = window.endKey
    ? slices.findIndex(slice => sliceKey(slice) === window.endKey) + 1
    : 0
  /* A prepend may move the boundary down, but must not hide revealed posts. */
  const visibleEnd = Math.max(
    endForPostCount(slices, window.count, getItemCount),
    previousEnd,
  )
  const visibleSlices = enabled ? slices.slice(0, visibleEnd) : slices
  const visiblePosts = countPosts(visibleSlices, getItemCount)
  const canShowMore =
    enabled && active && (visibleEnd < slices.length || hasNextPage)

  useEffect(() => {
    setLoadingScope(undefined)
    return () => {
      if (requestRef.current) requestRef.current.cancelled = true
      requestRef.current = undefined
      initialFillRef.current = undefined
    }
  }, [scope, active])

  const fillBatch = useNonReactiveCallback(
    async (wantedPostCount: number, initial: boolean) => {
      if (!enabled || !active || isFetching || requestRef.current) return
      const request = {cancelled: false}
      requestRef.current = request
      setLoadingScope(scope)

      const reveal = (nextSlices: TSlice[], wanted: number) => {
        const end = endForPostCount(nextSlices, wanted, getItemCount)
        const count = Math.max(
          batchSize,
          countPosts(nextSlices.slice(0, end), getItemCount),
        )
        const endKey = end ? sliceKey(nextSlices[end - 1]) : ''
        setWindow(current =>
          current.scope === scope ? {scope, count, endKey} : current,
        )
      }

      /* Reveal buffered content immediately, even if the batch needs a fetch. */
      if (!initial) reveal(slices, wantedPostCount)
      try {
        let nextSlices = slices
        let more = hasNextPage
        let failed = false
        for (
          let attempt = 0;
          attempt < 10 &&
          countPosts(nextSlices, getItemCount) < wantedPostCount &&
          more;
          attempt++
        ) {
          if (request.cancelled) return
          const result = await fetchNextPage({cancelRefetch: false})
          if (request.cancelled) return
          if (result.isError) {
            failed = true
            break
          }
          nextSlices = slicesFromData(result.data)
          more = !!result.hasNextPage
        }
        if (request.cancelled) return
        reveal(nextSlices, wantedPostCount)
        if (failed && !initial) {
          Toast.show(l`Couldn’t load more items. Please try again.`, {
            type: 'error',
          })
        }
      } catch (error) {
        if (request.cancelled) return
        if (!isNetworkError(error)) {
          logger.error('Failed to load incremental list', {safeMessage: error})
        }
        if (!initial) {
          Toast.show(l`Couldn’t load more items. Please try again.`, {
            type: 'error',
          })
        }
      } finally {
        if (requestRef.current === request) {
          requestRef.current = undefined
          setLoadingScope(undefined)
        }
      }
    },
  )

  useEffect(() => {
    if (
      !enabled ||
      !active ||
      isFetching ||
      isError ||
      initialFillRef.current === scope
    )
      return
    if (slices.length === 0 && !hasNextPage) return
    initialFillRef.current = scope
    if (visiblePosts < batchSize && hasNextPage) {
      void fillBatch(batchSize, true)
    } else if (visibleEnd > 0) {
      const endKey = sliceKey(slices[visibleEnd - 1])
      setWindow(current =>
        current.scope === scope && !current.endKey
          ? {...current, endKey}
          : current,
      )
    }
  }, [
    enabled,
    active,
    isFetching,
    isError,
    scope,
    visiblePosts,
    visibleEnd,
    batchSize,
    hasNextPage,
    slices,
    fillBatch,
  ])

  return {
    visibleSlices,
    canShowMore,
    showMorePostCount: batchSize,
    isLoadingMore:
      enabled && active && (loadingScope === scope || isFetchingNextPage),
    onPressShowMore: async () => {
      if (canShowMore) await fillBatch(visiblePosts + batchSize, false)
    },
    reset: () => {
      if (requestRef.current) requestRef.current.cancelled = true
      requestRef.current = undefined
      setResetVersion(version => version + 1)
    },
  }
}

function sliceKey(slice: IncrementalSlice) {
  return 'key' in slice ? slice.key : slice._reactKey
}

function countPosts<TSlice extends IncrementalSlice>(
  slices: readonly TSlice[],
  getItemCount: (slice: TSlice) => number,
) {
  return slices.reduce((count, slice) => count + getItemCount(slice), 0)
}

function endForPostCount<TSlice extends IncrementalSlice>(
  slices: readonly TSlice[],
  wanted: number,
  getItemCount: (slice: TSlice) => number,
) {
  let posts = 0
  for (let index = 0; index < slices.length; index++) {
    posts += getItemCount(slices[index])
    if (posts >= wanted) return index + 1
  }
  return slices.length
}

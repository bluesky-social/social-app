import {useState} from 'react'
import {type ListRenderItemInfo, View} from 'react-native'
import {type MessageDescriptor} from '@lingui/core'
import {useLingui} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {atoms as a, useTheme} from '#/alf'
import {FeedCardListSkeleton} from '#/components/FeedCardSkeleton'
import {ListFooter} from '#/components/Lists'
import {IS_WEB} from '#/env'
import {
  EMPTY_ROW,
  ERROR_ROW,
  LOAD_MORE_ERROR_ROW,
  LOADING_ROW,
  type ProfileSection,
  rowKey,
} from './types'

type StateRow =
  | typeof EMPTY_ROW
  | typeof ERROR_ROW
  | typeof LOADING_ROW
  | typeof LOAD_MORE_ERROR_ROW

export type PagedCardRow<T> = T | StateRow

/**
 * A tab that pages through cards: the account's custom feeds, its lists, or the
 * Starter Packs it has made.
 *
 * The tabs differ only in which query fills them and what a card looks like, so
 * the states that have to be rendered as rows - loading, empty, failed, and a
 * failed next page - are handled here once.
 */
export function usePagedCardsSection<T>({
  items,
  isPending,
  isError,
  error,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  refetch,
  renderCard,
  renderEmpty,
  loadMoreErrorMessage,
  onReset,
}: {
  items: T[] | undefined
  isPending: boolean
  isError: boolean
  error: unknown
  hasNextPage: boolean | undefined
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
  refetch: () => Promise<unknown>
  renderCard: (item: T, index: number) => React.ReactNode
  /** The tab's own empty state, which knows what the reader could do next. */
  renderEmpty: () => React.ReactElement
  loadMoreErrorMessage: MessageDescriptor
  onReset?: () => void
}): ProfileSection {
  const {t: l} = useLingui()
  const t = useTheme()
  const [isPTRing, setIsPTRing] = useState(false)

  const isEmpty = !isPending && !items?.length

  const rows: PagedCardRow<T>[] = []
  if (isError && isEmpty) {
    rows.push(ERROR_ROW)
  }
  if (isPending) {
    rows.push(LOADING_ROW)
  } else if (isEmpty) {
    rows.push(EMPTY_ROW)
  } else if (items) {
    rows.push(...items)
  }
  if (isError && !isEmpty) {
    rows.push(LOAD_MORE_ERROR_ROW)
  }

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh a profile tab', {message: err})
    }
    setIsPTRing(false)
  }

  const onEndReached = async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load the next page of a profile tab', {
        message: err,
      })
    }
  }

  const renderItem = ({item, index}: ListRenderItemInfo<PagedCardRow<T>>) => {
    if (item === EMPTY_ROW) {
      return renderEmpty()
    }
    if (item === ERROR_ROW) {
      return (
        <ErrorMessage
          message={cleanError(error)}
          onPressTryAgain={() => void refetch()}
        />
      )
    }
    if (item === LOAD_MORE_ERROR_ROW) {
      return (
        <LoadMoreRetryBtn
          label={l(loadMoreErrorMessage)}
          onPress={() => void fetchNextPage()}
        />
      )
    }
    if (item === LOADING_ROW) {
      return <FeedCardListSkeleton />
    }
    return (
      <View
        style={[
          (index !== 0 || IS_WEB) && a.border_t,
          t.atoms.border_contrast_low,
          a.px_lg,
          a.py_lg,
        ]}>
        {renderCard(item as T, index)}
      </View>
    )
  }

  return {
    data: rows,
    keyExtractor: row => rowKey(row),
    renderItem,
    onRefresh: () => void onRefresh(),
    refreshing: isPTRing,
    onEndReached: () => void onEndReached(),
    onReset,
    isEmpty,
    ListFooterComponent: isEmpty ? undefined : (
      <ListFooter
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onRetry={() => fetchNextPage()}
        error={cleanError(error)}
        height={180}
      />
    ),
  }
}

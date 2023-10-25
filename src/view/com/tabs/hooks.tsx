import React, {useMemo, Children} from 'react'
import {ActivityIndicator, View} from 'react-native'
import omit from 'lodash.omit'
import {useDeepCompareMemo} from 'use-deep-compare'
import {
  HEADER_ITEM,
  SELECTOR_ITEM,
  TAB_HEADER_ITEM,
  TAB_EMPTY_ITEM,
  TAB_PLACEHOLDER_ITEM,
  TAB_LOADING_MORE_ITEM,
  TAB_LOADING_MORE_SPACER_ITEM,
  TAB_ERROR_ITEM,
  TAB_LOAD_MORE_ERROR_ITEM,
  TabProps,
  TabOptions,
} from './types'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'

type TabReactElement = React.ReactElement<TabProps>

export function useTabOptions(
  children: (TabReactElement | null)[] | TabReactElement,
): [TabOptions[], string[]] {
  const memoedMap = useMemo(() => {
    const map: Map<string, TabOptions> = new Map()
    if (children) {
      Children.forEach(children, (element, index) => {
        if (!element) return

        const {name, ...options} = omit(element.props, 'children')
        if (map.has(name)) {
          throw new Error(`Tab names must be unique, ${name} already exists`)
        }

        map.set(name, {
          index,
          name,
          ...options,
        })
      })
    }
    return map
  }, [children])
  const tabOptions = Array.from(memoedMap.values())
  const tabNames = Array.from(memoedMap.keys())
  const memoizedTabOptions = useDeepCompareMemo(() => tabOptions, [tabOptions])
  const memoizedTabNames = useDeepCompareMemo(() => tabNames, [tabNames])
  return [memoizedTabOptions, memoizedTabNames]
}

type ItemsArray = any[]
type RenderItemFn = (item: any) => JSX.Element
export function useTabbedUIState(
  tabOptions: TabOptions,
): [ItemsArray, RenderItemFn] {
  const data = useMemo(() => {
    let arr = [HEADER_ITEM, SELECTOR_ITEM]
    if (tabOptions.renderHeader) {
      arr.push(TAB_HEADER_ITEM)
    }
    if (tabOptions.hasLoaded) {
      if (tabOptions.error) {
        arr.push(TAB_ERROR_ITEM)
      }
      if (tabOptions.isEmpty) {
        arr.push(TAB_EMPTY_ITEM)
      } else if (tabOptions.items) {
        arr = arr.concat(tabOptions.items)
      }
      if (tabOptions.loadMoreError) {
        arr.push(TAB_LOAD_MORE_ERROR_ITEM)
      }
      if (tabOptions.isLoading && !tabOptions.isRefreshing) {
        arr.push(TAB_LOADING_MORE_ITEM)
      } else {
        arr.push(TAB_LOADING_MORE_SPACER_ITEM) // to avoid layout jumps
      }
    } else if (tabOptions.isLoading) {
      arr.push(TAB_PLACEHOLDER_ITEM)
    }
    return arr
  }, [tabOptions])

  const renderItem = useMemo(() => {
    return (item: any) => {
      if (item === TAB_HEADER_ITEM) {
        return tabOptions.renderHeader
          ? tabOptions.renderHeader()
          : noopRender()
      }
      if (item === TAB_ERROR_ITEM) {
        return renderError(tabOptions.error || '', tabOptions.onRefresh || noop)
      }
      if (item === TAB_LOAD_MORE_ERROR_ITEM) {
        return renderLoadMoreError(tabOptions.onRetryLoadMore)
      }
      if (item === TAB_EMPTY_ITEM) {
        return tabOptions.renderEmpty ? tabOptions.renderEmpty() : noopRender()
      }
      if (item === TAB_PLACEHOLDER_ITEM) {
        return tabOptions.renderPlaceholder
          ? tabOptions.renderPlaceholder()
          : noopRender()
      }
      if (item === TAB_LOADING_MORE_ITEM) {
        return renderLoadingMore()
      }
      if (item === TAB_LOADING_MORE_SPACER_ITEM) {
        return renderLoadingMoreSpacer()
      }
      if (tabOptions.renderItem) {
        return tabOptions.renderItem(item)
      }
      return noopRender()
    }
  }, [tabOptions])

  return [data, renderItem]
}

function renderLoadingMore() {
  return (
    <View style={{height: 50}}>
      <ActivityIndicator />
    </View>
  )
}

function renderLoadingMoreSpacer() {
  return <View style={{height: 50}} />
}

function renderError(error: string, onPressTryAgain: () => void) {
  return <ErrorMessage message={error} onPressTryAgain={onPressTryAgain} />
}

function renderLoadMoreError(onPressRetryLoadMore?: () => void) {
  if (onPressRetryLoadMore) {
    return (
      <LoadMoreRetryBtn
        label="There was an issue fetching data. Tap here to try again."
        onPress={onPressRetryLoadMore}
      />
    )
  }
  return <View />
}

function noopRender() {
  return <View />
}

function noop() {}

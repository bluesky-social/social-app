import {OnScrollCb} from 'lib/hooks/useOnMainScroll'

export const HEADER_ITEM = {_reactKey: '__header__'}
export const SELECTOR_ITEM = {_reactKey: '__selector__'}
export const TAB_HEADER_ITEM = {_reactKey: '__tab_header__'}
export const TAB_EMPTY_ITEM = {_reactKey: '__tab_empty__'}
export const TAB_PLACEHOLDER_ITEM = {_reactKey: '__tab_placeholder__'}
export const TAB_LOADING_MORE_ITEM = {_reactKey: '__tab_loading_more__'}
export const TAB_LOADING_MORE_SPACER_ITEM = {
  _reactKey: '__tab_loading_more_spacer__',
}
export const TAB_ERROR_ITEM = {_reactKey: '__tab_error__'}
export const TAB_LOAD_MORE_ERROR_ITEM = {_reactKey: '__tab_load_more_error__'}

// props (passed into components)

export interface TabProps {
  readonly name: string
  items?: any[]
  isLoading?: boolean
  isRefreshing?: boolean
  hasLoaded?: boolean
  isEmpty?: boolean
  hasMore?: boolean
  error?: string
  loadMoreError?: string
  renderHeader?: () => JSX.Element
  renderItem?: (item: any) => JSX.Element
  renderPlaceholder?: () => JSX.Element
  renderEmpty?: () => JSX.Element
  onRefresh?: () => Promise<void>
  onEndReached?: () => void
  onRetryLoadMore?: () => void
}

export interface ContainerProps {
  children:
    | React.ReactElement<TabProps>
    | (React.ReactElement<TabProps> | null)[]
  renderHeader?: () => JSX.Element
  onSelectTab?: (index: number) => void
  onScroll?: OnScrollCb
}

// options (computed from elements)

export type TabOptions = TabProps & {index: number}

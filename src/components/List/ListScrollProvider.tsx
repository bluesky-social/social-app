import {createContext, useCallback, useContext, useMemo} from 'react'
import {type NativeScrollEvent} from 'react-native'
import {type ScrollHandlers} from 'react-native-reanimated'

export type NormalizedScrollHandlers = {
  /**
   * Web + Native — needs to be a `worklet` on native, but can be either on web
   */
  onScroll?: ScrollHandlers<any>['onScroll']
  /**
   * Native only
   */
  onScrollBeginDrag?: ScrollHandlers<any>['onBeginDrag']
  /**
   * Native only
   */
  onScrollEndDrag?: ScrollHandlers<any>['onEndDrag']
  /**
   * Native only
   */
  onMomentumScrollBegin?: ScrollHandlers<any>['onMomentumBegin']
  /**
   * Native only
   */
  onMomentumScrollEnd?: ScrollHandlers<any>['onMomentumEnd']
}

const ListScrollContext = createContext<NormalizedScrollHandlers>({
  onScroll: undefined,
  onScrollBeginDrag: undefined,
  onScrollEndDrag: undefined,
  onMomentumScrollBegin: undefined,
  onMomentumScrollEnd: undefined,
})
ListScrollContext.displayName = 'ListScrollContext'

export function ListScrollProvider({
  children,
  onScrollBeginDrag,
  onScrollEndDrag,
  onScroll,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
}: {children: React.ReactNode} & NormalizedScrollHandlers) {
  const handlers = useMemo(
    () => ({
      onScroll,
      onScrollBeginDrag: onScrollBeginDrag,
      onScrollEndDrag: onScrollEndDrag,
      onMomentumScrollBegin: onMomentumScrollBegin,
      onMomentumScrollEnd: onMomentumScrollEnd,
    }),
    [
      onScrollBeginDrag,
      onScrollEndDrag,
      onScroll,
      onMomentumScrollBegin,
      onMomentumScrollEnd,
    ],
  )
  return (
    <ListScrollContext.Provider value={handlers}>
      {children}
    </ListScrollContext.Provider>
  )
}

export function useListScrollContext(): NormalizedScrollHandlers {
  return useContext(ListScrollContext)
}

export const useListScrollHandler = useCallback<(e: NativeScrollEvent) => void>

import React, {memo, useRef, startTransition} from 'react'
import {FlatListProps, StyleSheet, View, ViewProps} from 'react-native'
import {addStyle} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {batchedUpdates} from '#/lib/batchedUpdates'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  | 'onScroll' // Use ScrollContext instead.
  | 'refreshControl' // Pass refreshing and/or onRefresh instead.
  | 'contentOffset' // Pass headerOffset instead.
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
  headerOffset?: number
  refreshing?: boolean
  onRefresh?: () => void
}
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

function ListImpl<ItemT>(
  {
    ListHeaderComponent,
    ListFooterComponent,
    contentContainerStyle,
    data,
    desktopFixedHeight, // TODO
    headerOffset,
    keyExtractor,
    refreshing: _unsupportedRefreshing,
    onEndReached,
    onEndReachedThreshold = 0,
    onRefresh: _unsupportedOnRefresh,
    onScrolledDownChange,
    onContentSizeChange,
    renderItem,
    extraData,
    style,
    ...props
  }: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
  const contextScrollHandlers = useScrollHandlers()
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  if (!isMobile) {
    contentContainerStyle = addStyle(
      contentContainerStyle,
      styles.containerScroll,
    )
  }

  let header: ListProps<ItemT>['ListHeaderComponent'] = null
  if (ListHeaderComponent != null) {
    if (typeof ListHeaderComponent === 'object') {
      header = ListHeaderComponent
    } else if (typeof ListHeaderComponent === 'function') {
      // @ts-ignore We aren't using classes so it's a render function.
      header = ListHeaderComponent()
    }
  }

  let footer: ListProps<ItemT>['ListHeaderComponent'] = null
  if (ListFooterComponent != null) {
    if (typeof ListFooterComponent === 'object') {
      footer = ListFooterComponent
    } else if (typeof ListFooterComponent === 'function') {
      // @ts-ignore We aren't using classes so it's a render function.
      footer = ListFooterComponent()
    }
  }

  if (headerOffset != null) {
    style = addStyle(style, {
      paddingTop: headerOffset,
    })
  }

  const nativeRef = React.useRef(null)
  React.useImperativeHandle(
    ref,
    () =>
      ({
        scrollToTop() {
          window.scrollTo({top: 0})
        },
        scrollToOffset({
          animated,
          offset,
        }: {
          animated: boolean
          offset: number
        }) {
          window.scrollTo({
            left: 0,
            top: offset,
            behavior: animated ? 'smooth' : 'instant',
          })
        },
      } as any), // TODO: Types.
    [],
  )

  const [isVisible, setIsVisible] = React.useState(false)
  const handleScroll = useNonReactiveCallback(() => {
    contextScrollHandlers.onScroll?.(
      {
        contentOffset: {
          x: window.scrollX,
          y: window.scrollY,
        },
        // TODO
      },
      {
        /* TODO */
      },
    )
  })
  React.useEffect(() => {
    if (!isVisible) {
      return
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isVisible, handleScroll])

  const isScrolledDown = useRef(false)
  function handleAboveTheFoldVisibleChange(isAboveTheFold: boolean) {
    const didScrollDown = !isAboveTheFold
    if (isScrolledDown.current !== didScrollDown) {
      isScrolledDown.current = didScrollDown
      startTransition(() => {
        onScrolledDownChange?.(didScrollDown)
      })
    }
  }

  const containerRef = useRef(null)
  useResizeObserver(containerRef, onContentSizeChange)

  return (
    <View {...props} style={style} ref={nativeRef}>
      <Visibility
        onVisibleChange={setIsVisible}
        style={styles.parentTreeVisibilityDetector}
      />
      <View
        ref={containerRef}
        style={[
          styles.contentContainer,
          contentContainerStyle,
          desktopFixedHeight ? styles.minHeightViewport : null,
          pal.border,
        ]}>
        <Visibility
          onVisibleChange={handleAboveTheFoldVisibleChange}
          style={[styles.aboveTheFoldDetector, {height: headerOffset}]}
        />
        {header}
        {(data as Array<ItemT>).map((item, index) => (
          <Row<ItemT>
            key={keyExtractor!(item, index)}
            item={item}
            index={index}
            renderItem={renderItem}
            extraData={extraData}
          />
        ))}
        {onEndReached && (
          <Visibility
            topMargin={(onEndReachedThreshold ?? 0) * 100 + '%'}
            onVisibleChange={isVisible => {
              if (isVisible) {
                onEndReached?.({
                  distanceFromEnd: onEndReachedThreshold || 0,
                })
              }
            }}
          />
        )}
        {footer}
      </View>
    </View>
  )
}

function useResizeObserver(ref, onResize) {
  const handleResize = useNonReactiveCallback(onResize ?? (() => {}))
  const isActive = !!onResize
  React.useEffect(() => {
    if (!isActive) {
      return
    }
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    const node = ref.current
    resizeObserver.observe(node)
    return () => {
      resizeObserver.unobserve(node)
    }
  }, [handleResize, isActive, ref])
}

let Row = function RowImpl<ItemT>({
  item,
  index,
  renderItem,
  extraData: _unused,
}: {
  item: ItemT
  index: number
  renderItem:
    | null
    | undefined
    | ((data: {index: number; item: any; separators: any}) => React.ReactNode)
  extraData: any
}): React.ReactNode {
  if (!renderItem) {
    return null
  }
  return (
    <View style={styles.row}>
      {renderItem({item, index, separators: null as any})}
    </View>
  )
}
Row = React.memo(Row)

let Visibility = ({
  topMargin = '0px',
  onVisibleChange,
  style,
}: {
  topMargin?: string
  onVisibleChange: (isVisible: boolean) => void
  style?: ViewProps['style']
}): React.ReactNode => {
  const tailRef = React.useRef(null)
  const isIntersecting = React.useRef(false)

  const handleIntersection = useNonReactiveCallback(
    (entries: IntersectionObserverEntry[]) => {
      batchedUpdates(() => {
        entries.forEach(entry => {
          if (entry.isIntersecting !== isIntersecting.current) {
            isIntersecting.current = entry.isIntersecting
            onVisibleChange(entry.isIntersecting)
          }
        })
      })
    },
  )

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${topMargin} 0px 0px 0px`,
    })
    const tail: Element | null = tailRef.current!
    observer.observe(tail)
    return () => {
      observer.unobserve(tail)
    }
  }, [handleIntersection, topMargin])

  return (
    <View ref={tailRef} style={addStyle(styles.visibilityDetector, style)} />
  )
}
Visibility = React.memo(Visibility)

export const List = memo(React.forwardRef(ListImpl)) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement

const styles = StyleSheet.create({
  contentContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  containerScroll: {
    width: '100%',
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  row: {
    // @ts-ignore web only
    contentVisibility: 'auto',
  },
  minHeightViewport: {
    // @ts-ignore web only
    minHeight: '100vh',
  },
  parentTreeVisibilityDetector: {
    // @ts-ignore web only
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aboveTheFoldDetector: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Bottom is dynamic.
  },
  visibilityDetector: {
    pointerEvents: 'none',
    zIndex: -1,
  },
})

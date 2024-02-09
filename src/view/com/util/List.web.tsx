import React, {isValidElement, memo, useRef, startTransition} from 'react'
import {FlatListProps, StyleSheet, View, ViewProps} from 'react-native'
import {addStyle} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {batchedUpdates} from '#/lib/batchedUpdates'

export type ListMethods = any // TODO: Better types.
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
  desktopFixedHeight: any // TODO: Better types.
}
export type ListRef = React.MutableRefObject<any | null> // TODO: Better types.

function ListImpl<ItemT>(
  {
    ListHeaderComponent,
    ListFooterComponent,
    contentContainerStyle,
    data,
    desktopFixedHeight,
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

  let header: JSX.Element | null = null
  if (ListHeaderComponent != null) {
    if (isValidElement(ListHeaderComponent)) {
      header = ListHeaderComponent
    } else {
      // @ts-ignore Nah it's fine.
      header = <ListHeaderComponent />
    }
  }

  let footer: JSX.Element | null = null
  if (ListFooterComponent != null) {
    if (isValidElement(ListFooterComponent)) {
      footer = ListFooterComponent
    } else {
      // @ts-ignore Nah it's fine.
      footer = <ListFooterComponent />
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
      } as any), // TODO: Better types.
    [],
  )

  // --- onContentSizeChange ---
  const containerRef = useRef(null)
  useResizeObserver(containerRef, onContentSizeChange)

  // --- onScroll ---
  const [isInsideVisibleTree, setIsInsideVisibleTree] = React.useState(false)
  const handleWindowScroll = useNonReactiveCallback(() => {
    if (isInsideVisibleTree) {
      contextScrollHandlers.onScroll?.(
        {
          contentOffset: {
            x: Math.max(0, window.scrollX),
            y: Math.max(0, window.scrollY),
          },
        } as any, // TODO: Better types.
        null as any,
      )
    }
  })
  React.useEffect(() => {
    if (!isInsideVisibleTree) {
      // Prevents hidden tabs from firing scroll events.
      // Only one list is expected to be firing these at a time.
      return
    }
    window.addEventListener('scroll', handleWindowScroll)
    return () => {
      window.removeEventListener('scroll', handleWindowScroll)
    }
  }, [isInsideVisibleTree, handleWindowScroll])

  // --- onScrolledDownChange ---
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

  // --- onEndReached ---
  const onTailVisibilityChange = useNonReactiveCallback(
    (isTailVisible: boolean) => {
      if (isTailVisible) {
        onEndReached?.({
          distanceFromEnd: onEndReachedThreshold || 0,
        })
      }
    },
  )

  return (
    <View {...props} style={style} ref={nativeRef}>
      <Visibility
        onVisibleChange={setIsInsideVisibleTree}
        style={
          // This has position: fixed, so it should always report as visible
          // unless we're within a display: none tree (like a hidden tab).
          styles.parentTreeVisibilityDetector
        }
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
            onVisibleChange={onTailVisibilityChange}
          />
        )}
        {footer}
      </View>
    </View>
  )
}

function useResizeObserver(
  ref: React.RefObject<Element>,
  onResize: undefined | ((w: number, h: number) => void),
) {
  const handleResize = useNonReactiveCallback(onResize ?? (() => {}))
  const isActive = !!onResize
  React.useEffect(() => {
    if (!isActive) {
      return
    }
    const resizeObserver = new ResizeObserver(entries => {
      batchedUpdates(() => {
        for (let entry of entries) {
          const rect = entry.contentRect
          handleResize(rect.width, rect.height)
        }
      })
    })
    const node = ref.current!
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

// https://stackoverflow.com/questions/7944460/detect-safari-browser
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

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
    contentVisibility: isSafari ? '' : 'auto', // Safari support for this is buggy.
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

import React, {memo, startTransition} from 'react'
import {FlatListProps, StyleSheet, View} from 'react-native'
import {addStyle} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'

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
    onEndReachedThreshold,
    onRefresh: _unsupportedOnRefresh,
    onScrolledDownChange, // TODO
    renderItem,
    extraData,
    style,
    ...props
  }: ListProps<ItemT>,
  ref: React.Ref<ListMethods>,
) {
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

  React.useEffect(() => {
    if (!isVisible) {
      return
    }
    function handleScroll() {
      console.log(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isVisible])

  return (
    <View style={{paddingTop: 0}}>
      <View {...props} style={style} ref={nativeRef}>
        <View
          style={[
            styles.contentContainer,
            contentContainerStyle,
            desktopFixedHeight ? styles.minHeightViewport : null,
            pal.border,
          ]}>
          <View style={styles.visibilityDetector}>
            <Visibility
              onVisibleChange={newIsVisible => {
                setIsVisible(newIsVisible)
              }}
            />
          </View>
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
              threshold={onEndReachedThreshold}
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
    </View>
  )
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
  threshold = 0,
  onVisibleChange,
}: {
  threshold?: number | null | undefined
  onVisibleChange: (isVisible: boolean) => void
}): React.ReactNode => {
  const tailRef = React.useRef(null)
  const isIntersecting = React.useRef(false)

  const handleIntersection = useNonReactiveCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting !== isIntersecting.current) {
          isIntersecting.current = entry.isIntersecting
          onVisibleChange(entry.isIntersecting)
        }
      })
    },
  )

  React.useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: (threshold || 0) * 100 + '%',
    })
    const tail: Element | null = tailRef.current!
    observer.observe(tail)
    return () => {
      observer.unobserve(tail)
    }
  }, [handleIntersection, threshold])

  return <View ref={tailRef} />
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
  visibilityDetector: {
    // @ts-ignore web only
    position: 'fixed',
  },
})

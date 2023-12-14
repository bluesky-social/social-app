import React, {memo, startTransition} from 'react'
import {FlatListProps, ScrollView, StyleSheet, View} from 'react-native'
import {addStyle} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

export type ListMethods = FlatList_INTERNAL
export type ListProps<ItemT> = Omit<
  FlatListProps<ItemT>,
  'onScroll' // Use ScrollContext instead.
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void
}
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>

function ListImpl<ItemT>(
  {
    ListHeaderComponent,
    ListFooterComponent,
    contentContainerStyle,
    contentOffset,
    data,
    desktopFixedHeight,
    keyExtractor,
    onEndReached,
    onEndReachedThreshold,
    onScrolledDownChange,
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

  if (contentOffset && contentOffset?.y !== 0) {
    // NOTE
    // we use paddingTop & contentOffset to space around the floating header
    // but reactnative web puts the paddingTop on the wrong element (style instead of the contentContainer)
    // so we manually correct it here
    // -prf
    style = addStyle(style, {
      paddingTop: 0,
    })
    contentContainerStyle = addStyle(contentContainerStyle, {
      paddingTop: Math.abs(contentOffset.y),
    })
  }

  let header = null
  if (ListHeaderComponent != null) {
    if (typeof ListHeaderComponent === 'object') {
      header = ListHeaderComponent
    } else if (typeof ListHeaderComponent === 'function') {
      // @ts-ignore We aren't using classes so it's a render function.
      header = ListHeaderComponent()
    }
  }

  let footer = null
  if (ListFooterComponent != null) {
    if (typeof ListFooterComponent === 'object') {
      footer = ListFooterComponent
    } else if (typeof ListFooterComponent === 'function') {
      // @ts-ignore We aren't using classes so it's a render function.
      footer = ListFooterComponent()
    }
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

  const onVisible = React.useCallback(() => {
    onEndReached?.({
      distanceFromEnd: onEndReachedThreshold || 0,
    })
  }, [onEndReachedThreshold, onEndReached])

  return (
    <ScrollView {...props} style={style} ref={nativeRef}>
      <View
        style={[
          styles.contentContainer,
          contentContainerStyle,
          desktopFixedHeight ? styles.minHeightViewport : null,
          pal.border,
        ]}>
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
          <Tail threshold={onEndReachedThreshold} onVisible={onVisible} />
        )}
        {footer}
      </View>
    </ScrollView>
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

let Tail = ({
  threshold = 0,
  onVisible,
}: {
  threshold?: number | null | undefined
  onVisible: () => void
}): React.ReactNode => {
  const tailRef = React.useRef(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onVisible()
          }
        })
      },
      {
        rootMargin: (threshold || 0) * 100 + '%',
      },
    )
    const tail: Element | null = tailRef.current!
    observer.observe(tail)
    return () => {
      observer.unobserve(tail)
    }
  }, [onVisible, threshold])

  return <View ref={tailRef} />
}
Tail = React.memo(Tail)

export const List = memo(React.forwardRef(ListImpl)) as <ItemT>(
  props: ListProps<ItemT> & {ref?: React.Ref<ListMethods>},
) => React.ReactElement

const styles = StyleSheet.create({
  contentContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  containerScroll: {
    width: '100%',
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  row: {
    // @ts-ignore web
    contentVisibility: 'auto',
  },
  minHeightViewport: {
    // @ts-ignore web only
    minHeight: '100vh',
  },
})

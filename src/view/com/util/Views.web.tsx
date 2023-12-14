/**
 * In the Web build, we center all content so that it mirrors the
 * mobile experience (a single narrow column). We then place a UI
 * shell around the content if you're in desktop.
 *
 * Because scrolling is handled by components deep in the hierarchy,
 * we can't just wrap the top-level element with a max width. The
 * centering has to be done at the ScrollView.
 *
 * These components wrap the RN ScrollView-based components to provide
 * consistent layout. It also provides <CenteredView> for views that
 * need to match layout but which aren't scrolled.
 */

import React from 'react'
import {
  FlatListProps,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native'
import {addStyle} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import Animated from 'react-native-reanimated'

interface AddedProps {
  desktopFixedHeight?: boolean | number
}

export function CenteredView({
  style,
  sideBorders,
  ...props
}: React.PropsWithChildren<ViewProps & {sideBorders?: boolean}>) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  if (!isMobile) {
    style = addStyle(style, styles.container)
  }
  if (sideBorders) {
    style = addStyle(style, {
      borderLeftWidth: 1,
      borderRightWidth: 1,
    })
    style = addStyle(style, pal.border)
  }
  return <View style={style} {...props} />
}

export const FlatList_INTERNAL = React.forwardRef(function FlatListImpl<ItemT>(
  {
    data,
    extraData,
    contentOffset,
    keyExtractor,
    renderItem,
    style,
    contentContainerStyle,
    onEndReached,
    onEndReachedThreshold,
    onScroll: _unused, // Not supported on the web.
    ListHeaderComponent,
    ListFooterComponent,
    desktopFixedHeight,
    ...props
  }: React.PropsWithChildren<FlatListProps<ItemT> & AddedProps>,
  ref: React.Ref<Animated.FlatList<ItemT>>,
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

  return (
    <Animated.ScrollView {...props} style={style} ref={nativeRef}>
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
    </Animated.ScrollView>
  )
})

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

export const ScrollView = React.forwardRef(function ScrollViewImpl(
  {contentContainerStyle, ...props}: React.PropsWithChildren<ScrollViewProps>,
  ref: React.Ref<Animated.ScrollView>,
) {
  const pal = usePalette('default')

  const {isMobile} = useWebMediaQueries()
  if (!isMobile) {
    contentContainerStyle = addStyle(
      contentContainerStyle,
      styles.containerScroll,
    )
  }
  return (
    <Animated.ScrollView
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
        pal.border,
      ]}
      // @ts-ignore something is wrong with the reanimated types -prf
      ref={ref}
      {...props}
    />
  )
})

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

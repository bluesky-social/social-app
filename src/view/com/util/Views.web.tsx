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
  FlatList,
  FlatListProps,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native'
import Animated from 'react-native-reanimated'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {addStyle} from '#/lib/styles'

interface AddedProps {
  desktopFixedHeight?: boolean | number
}

export const CenteredView = React.forwardRef(function CenteredView(
  {
    style,
    sideBorders,
    topBorder,
    ...props
  }: React.PropsWithChildren<
    ViewProps & {sideBorders?: boolean; topBorder?: boolean}
  >,
  ref: React.Ref<View>,
) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  if (!isMobile) {
    style = addStyle(style, styles.container)
  }
  if (sideBorders && !isMobile) {
    style = addStyle(style, {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
    })
    style = addStyle(style, pal.border)
  }
  if (topBorder) {
    style = addStyle(style, {
      borderTopWidth: 1,
    })
    style = addStyle(style, pal.border)
  }
  return <View ref={ref} style={style} {...props} />
})

export const FlatList_INTERNAL = React.forwardRef(function FlatListImpl<ItemT>(
  {
    contentContainerStyle,
    style,
    contentOffset,
    desktopFixedHeight,
    ...props
  }: React.PropsWithChildren<
    Omit<FlatListProps<ItemT>, 'CellRendererComponent'> & AddedProps
  >,
  ref: React.Ref<FlatList<ItemT>>,
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
  if (desktopFixedHeight) {
    if (typeof desktopFixedHeight === 'number') {
      // @ts-ignore Web only -prf
      style = addStyle(style, {
        height: `calc(100vh - ${desktopFixedHeight}px)`,
      })
    } else {
      style = addStyle(style, styles.fixedHeight)
    }
    if (!isMobile) {
      // NOTE
      // react native web produces *three* wrapping divs
      // the first two use the `style` prop and the innermost uses the
      // `contentContainerStyle`. Unfortunately the stable-gutter style
      // needs to be applied to only the "middle" of these. To hack
      // around this, we set data-stable-gutters which can then be
      // styled in our external CSS.
      // -prf
      // @ts-ignore web only -prf
      props.dataSet = props.dataSet || {}
      // @ts-ignore web only -prf
      props.dataSet.stableGutters = '1'
    }
  }
  return (
    <Animated.FlatList
      ref={ref}
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
        pal.border,
      ]}
      style={style}
      contentOffset={contentOffset}
      {...props}
    />
  )
})

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
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    // @ts-ignore web only
    minHeight: '100vh',
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
  fixedHeight: {
    // @ts-ignore web only
    height: '100vh',
  },
})

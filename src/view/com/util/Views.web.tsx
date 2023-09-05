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
  FlatList as RNFlatList,
  FlatListProps,
  ScrollView as RNScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native'
import {addStyle} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

interface AddedProps {
  desktopFixedHeight?: boolean
}

export function CenteredView({
  style,
  ...props
}: React.PropsWithChildren<ViewProps>) {
  style = addStyle(style, styles.container)
  return <View style={style} {...props} />
}

export const FlatList = React.forwardRef(function <ItemT>(
  {
    contentContainerStyle,
    style,
    contentOffset,
    desktopFixedHeight,
    ...props
  }: React.PropsWithChildren<FlatListProps<ItemT> & AddedProps>,
  ref: React.Ref<RNFlatList>,
) {
  const pal = usePalette('default')
  const {isMobile} = useWebMediaQueries()
  contentContainerStyle = addStyle(
    contentContainerStyle,
    styles.containerScroll,
  )
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
    style = addStyle(style, styles.fixedHeight)
    if (!isMobile) {
      contentContainerStyle = addStyle(
        contentContainerStyle,
        styles.stableGutters,
      )
    }
  }
  return (
    <RNFlatList
      ref={ref}
      contentContainerStyle={[
        contentContainerStyle,
        pal.border,
        styles.contentContainer,
      ]}
      style={style}
      contentOffset={contentOffset}
      {...props}
    />
  )
})

export const ScrollView = React.forwardRef(function (
  {contentContainerStyle, ...props}: React.PropsWithChildren<ScrollViewProps>,
  ref: React.Ref<RNScrollView>,
) {
  const pal = usePalette('default')

  contentContainerStyle = addStyle(
    contentContainerStyle,
    styles.containerScroll,
  )
  return (
    <RNScrollView
      contentContainerStyle={[
        contentContainerStyle,
        pal.border,
        styles.contentContainer,
      ]}
      ref={ref}
      {...props}
    />
  )
})

const styles = StyleSheet.create({
  contentContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
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
  stableGutters: {
    // @ts-ignore web only -prf
    scrollbarGutter: 'stable both-edges',
  },
})

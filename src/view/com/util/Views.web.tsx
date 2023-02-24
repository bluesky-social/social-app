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
import {addStyle, colors} from 'lib/styles'
import {DESKTOP_HEADER_HEIGHT} from 'lib/constants'

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
    ...props
  }: React.PropsWithChildren<FlatListProps<ItemT>>,
  ref: React.Ref<RNFlatList>,
) {
  contentContainerStyle = addStyle(
    contentContainerStyle,
    styles.containerScroll,
  )
  return (
    <RNFlatList
      contentContainerStyle={contentContainerStyle}
      ref={ref}
      {...props}
    />
  )
})

export const ScrollView = React.forwardRef(function (
  {contentContainerStyle, ...props}: React.PropsWithChildren<ScrollViewProps>,
  ref: React.Ref<RNScrollView>,
) {
  contentContainerStyle = addStyle(
    contentContainerStyle,
    styles.containerScroll,
  )
  return (
    <RNScrollView
      contentContainerStyle={contentContainerStyle}
      ref={ref}
      {...props}
    />
  )
})

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 550,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  containerScroll: {
    width: '100%',
    height: `calc(100vh - ${DESKTOP_HEADER_HEIGHT}px)`,
    maxWidth: 550,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  containerLight: {
    backgroundColor: colors.gray1,
  },
  containerDark: {
    backgroundColor: colors.gray7,
  },
})

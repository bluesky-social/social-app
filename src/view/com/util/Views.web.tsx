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
  StyleProp,
  View,
  ViewProps,
} from 'react-native'

export function CenteredView({
  style,
  ...props
}: React.PropsWithChildren<ViewProps>) {
  style = addStyle(style, styles.container)
  return <View style={style} {...props} />
}

export function FlatList<ItemT>({
  contentContainerStyle,
  ...props
}: React.PropsWithChildren<FlatListProps<ItemT>>) {
  contentContainerStyle = addStyle(contentContainerStyle, styles.container)
  return <RNFlatList contentContainerStyle={contentContainerStyle} {...props} />
}

export function ScrollView({
  contentContainerStyle,
  ...props
}: React.PropsWithChildren<ScrollViewProps>) {
  contentContainerStyle = addStyle(contentContainerStyle, styles.container)
  return (
    <RNScrollView contentContainerStyle={contentContainerStyle} {...props} />
  )
}

function addStyle<T>(
  base: StyleProp<T>,
  addedStyle: StyleProp<T>,
): StyleProp<T> {
  if (Array.isArray(base)) {
    return base.concat([addedStyle])
  }
  return [base, addedStyle]
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
})

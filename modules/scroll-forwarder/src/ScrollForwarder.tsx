import React from 'react'
import {Platform} from 'react-native'
import {ScrollForwarderProps, ScrollForwarderView} from './index'

/**
 * We need to forward scroll events on this view to an RCTScrollView. To do that, we need to pass the react tag
 * for the ScrollView/FlatList/etc. that we want to forward the scroll to. We will make a context that lets us
 * forward the value.
 */

export function ScrollForwarder({
  scrollViewTag,
  onScrollViewRefresh,
  scrollViewRefreshing,
  children,
}: ScrollForwarderProps) {
  if (Platform.OS !== 'ios') return children

  return (
    <ScrollForwarderView
      scrollViewTag={scrollViewTag?.toString()}
      onScrollViewRefresh={onScrollViewRefresh}
      scrollViewRefreshing={scrollViewRefreshing}>
      {children}
    </ScrollForwarderView>
  )
}

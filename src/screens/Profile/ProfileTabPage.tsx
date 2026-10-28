import {useEffect, useState} from 'react'
import {type ScrollView, useWindowDimensions, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {List, type ListMethods, type ListRef} from '#/view/com/util/List'
import {findListNativeTag} from '#/view/com/util/listNativeTag'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {type ProfileSection} from '#/screens/Profile/Sections/types'
import {IS_IOS, IS_NATIVE, IS_WEB} from '#/env'

/**
 * One tab of a profile: the list the reader scrolls, and the button that says
 * there are newer posts above them.
 *
 * Each tab is a page of the pager, and the pager is what gives the profile a
 * swipe that follows the finger. That is why the header is not part of these
 * lists: it is drawn above them, and every page starts its content below it.
 */
export function ProfileTabPage({
  section,
  headerHeight,
  isFocused,
  scrollElRef,
  setScrollViewTag,
  registerScrollToTop,
}: {
  section: ProfileSection
  /** The header's height, which every page leaves at the top of its content. */
  headerHeight: number
  isFocused: boolean
  scrollElRef: React.MutableRefObject<
    ListMethods | React.ComponentRef<typeof ScrollView> | null
  >
  setScrollViewTag: (tag: number | null) => void
  registerScrollToTop: (scrollToTop: (() => void) | null) => void
}) {
  const {t: l} = useLingui()
  const {height: windowHeight} = useWindowDimensions()
  const [isScrolledDown, setIsScrolledDown] = useState(false)

  const scrollToTop = () => {
    const list = scrollElRef.current as ListMethods | null
    list?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerHeight,
    })
    section.onReset?.()
  }

  useEffect(() => {
    registerScrollToTop(scrollToTop)
    return () => registerScrollToTop(null)
  })

  /*
   * The header is outside this list, so a pull that starts on it has to be
   * forwarded here: this reports which list that is.
   */
  useEffect(() => {
    if (IS_IOS && isFocused && scrollElRef.current) {
      setScrollViewTag(findListNativeTag(scrollElRef.current as ListMethods))
    }
  }, [isFocused, scrollElRef, setScrollViewTag])

  return (
    <View>
      <List
        ref={scrollElRef as ListRef}
        data={section.data}
        renderItem={section.renderItem}
        keyExtractor={section.keyExtractor}
        ListFooterComponent={section.ListFooterComponent}
        refreshing={section.refreshing}
        onRefresh={section.onRefresh}
        headerOffset={headerHeight}
        progressViewOffset={0}
        onEndReached={section.onEndReached}
        onEndReachedThreshold={2}
        onItemSeen={section.onItemSeen}
        onScrolledDownChange={isDown => {
          setIsScrolledDown(isDown)
          section.onScrolledDownChange?.(isDown)
        }}
        contentContainerStyle={{
          // Enough content to reach the header's collapsed position even when
          // the tab is empty, so changing tabs cannot clamp the reader upwards.
          minHeight: windowHeight + headerHeight,
        }}
        windowSize={IS_WEB ? undefined : 9}
        maxToRenderPerBatch={IS_WEB ? undefined : 5}
        updateCellsBatchingPeriod={40}
        removeClippedSubviews={!IS_WEB}
        desktopFixedHeight
      />
      {(isScrolledDown || section.hasNew) && (
        <LoadLatestBtn
          onPress={scrollToTop}
          label={l(msg`Load new posts`)}
          showIndicator={!!section.hasNew}
        />
      )}
    </View>
  )
}

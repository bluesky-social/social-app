import React from 'react'
import {
  findNodeHandle,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyGraphDefs, AppBskyGraphGetActorStarterPacks} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {InfiniteData, UseInfiniteQueryResult} from '@tanstack/react-query'

import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {List, ListRef} from 'view/com/util/List'
import {Text} from 'view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {StarterPackCard} from '#/components/StarterPack/StarterPackCard'

interface SectionRef {
  scrollToTop: () => void
}

interface ProfileFeedgensProps {
  starterPacksQuery: UseInfiniteQueryResult<
    InfiniteData<AppBskyGraphGetActorStarterPacks.OutputSchema, unknown>,
    Error
  >
  scrollElRef: ListRef
  headerOffset: number
  enabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  setScrollViewTag: (tag: number | null) => void
}

function renderItem({
  item,
  index,
}: ListRenderItemInfo<AppBskyGraphDefs.StarterPackView>) {
  return (
    <StarterPackCard
      starterPack={item}
      type="list"
      hideTopBorder={!isWeb && index === 0}
    />
  )
}

function keyExtractor(item: AppBskyGraphDefs.StarterPackView) {
  return item.uri
}

export const ProfileStarterPacks = React.forwardRef<
  SectionRef,
  ProfileFeedgensProps
>(function ProfileFeedgensImpl(
  {
    starterPacksQuery: query,
    scrollElRef,
    headerOffset,
    enabled,
    style,
    testID,
    setScrollViewTag,
  },
  ref,
) {
  const t = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data, refetch, isFetching, hasNextPage, fetchNextPage} = query

  const items = data?.pages.flatMap(page => page.starterPacks)

  React.useImperativeHandle(ref, () => ({
    scrollToTop: () => {},
  }))

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh starter packs', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more starter packs', {message: err})
    }
  }, [isFetching, hasNextPage, fetchNextPage])

  React.useEffect(() => {
    if (enabled && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [enabled, scrollElRef, setScrollViewTag])

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        headerOffset={headerOffset}
        contentContainerStyle={isNative && {paddingBottom: headerOffset + 100}}
        indicatorStyle={t.name === 'light' ? 'black' : 'white'}
        removeClippedSubviews={true}
        desktopFixedHeight
        onEndReached={onEndReached}
        ListEmptyComponent={<EmptyComponent />}
      />
    </View>
  )
})

function EmptyComponent() {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <View style={[a.mt_xl, a.px_2xl, a.gap_2xl]}>
      <Text
        style={[
          a.font_bold,
          a.text_lg,
          a.text_center,
          t.atoms.text_contrast_medium,
        ]}>
        You have not created any starter packs yet!
      </Text>
      <Text style={[a.text_center]}>
        Create a starter pack now to share your favorite people and feeds with
        friends!
      </Text>
      <Button
        label={_(msg`Create a starter pack`)}
        variant="solid"
        color="primary"
        size="medium">
        <ButtonText>
          <Trans>Create a starter pack</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}

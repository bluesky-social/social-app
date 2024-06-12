import React from 'react'
import {
  findNodeHandle,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {LinearGradient} from 'expo-linear-gradient'
import {AppBskyGraphDefs, AppBskyGraphGetActorStarterPacks} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {InfiniteData, UseInfiniteQueryResult} from '@tanstack/react-query'

import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {NavigationProp} from 'lib/routes/types'
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
  const navigation = useNavigation<NavigationProp>()
  const gradient =
    t.name === 'light'
      ? [t.palette.primary_500, t.palette.primary_400]
      : [t.palette.primary_600, t.palette.primary_500]

  return (
    <LinearGradient
      colors={gradient}
      style={[a.px_md, a.py_xl, a.justify_between, a.gap_md, a.shadow_lg]}>
      <View style={[a.gap_xs]}>
        <Text
          style={[
            a.font_bold,
            a.text_lg,
            t.atoms.text_contrast_medium,
            {color: 'white'},
          ]}>
          You have not created a starter pack yet!
        </Text>
        <Text style={[{color: 'white'}]}>
          Starter packs let you easily share your favorite feeds and people with
          your friends.
        </Text>
      </View>
      <Button
        label={_(msg`Create a starter pack`)}
        variant="outline"
        color="primary"
        size="small"
        onPress={() => navigation.navigate('StarterPackWizard', {})}
        style={[{width: 100, marginLeft: 'auto'}]}>
        <ButtonText>
          <Trans>Create</Trans>
        </ButtonText>
      </Button>
    </LinearGradient>
  )
}

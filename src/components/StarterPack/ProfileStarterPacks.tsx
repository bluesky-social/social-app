import React from 'react'
import {
  findNodeHandle,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {
  AppBskyGraphDefs,
  AppBskyGraphGetActorStarterPacks,
  AtUri,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {InfiniteData, UseInfiniteQueryResult} from '@tanstack/react-query'

import {logger} from '#/logger'
import {generateStarterpack} from 'lib/generate-starterpack'
import {useBottomBarOffset} from 'lib/hooks/useBottomBarOffset'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {useAgent} from 'state/session'
import {List, ListRef} from 'view/com/util/List'
import {Text} from 'view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Default as StarterPackCard} from '#/components/StarterPack/StarterPackCard'

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
  const bottomBarOffset = useBottomBarOffset(100)
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data, refetch, isFetching, hasNextPage, fetchNextPage} = query
  const {isTabletOrDesktop} = useWebMediaQueries()

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

  const renderItem = ({
    item,
    index,
  }: ListRenderItemInfo<AppBskyGraphDefs.StarterPackView>) => {
    return (
      <View
        style={[
          a.p_lg,
          (isTabletOrDesktop || index !== 0) && a.border_t,
          t.atoms.border_contrast_low,
        ]}>
        <StarterPackCard starterPack={item} />
      </View>
    )
  }

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshing={isPTRing}
        headerOffset={headerOffset}
        contentContainerStyle={{paddingBottom: headerOffset + bottomBarOffset}}
        indicatorStyle={t.name === 'light' ? 'black' : 'white'}
        removeClippedSubviews={true}
        desktopFixedHeight
        onEndReached={onEndReached}
        onRefresh={onRefresh}
        ListEmptyComponent={EmptyComponent}
      />
    </View>
  )
})

function EmptyComponent() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const agent = useAgent()
  const confirmDialogControl = useDialogControl()
  const followersDialogControl = useDialogControl()
  const errorDialogControl = useDialogControl()

  const [isGenerating, setIsGenerating] = React.useState(false)

  const generate = async () => {
    setIsGenerating(true)

    const res = await generateStarterpack({agent})

    if (res === 'NOT_ENOUGH_FOLLOWERS') {
      followersDialogControl.open()
      setIsGenerating(false)
    } else if (res === 'ERROR') {
      errorDialogControl.open()
      setIsGenerating(false)
    } else {
      const atUri = new AtUri(res)
      setTimeout(() => {
        navigation.push('StarterPack', {
          name: atUri.hostname,
          rkey: atUri.rkey,
        })
        setIsGenerating(false)
      }, 1000)
    }
  }

  return (
    <LinearGradientBackground
      style={[
        a.px_md,
        a.py_xl,
        a.justify_between,
        a.gap_lg,
        a.shadow_lg,
        {marginTop: 2},
      ]}>
      <View style={[a.gap_xs]}>
        <Text
          style={[
            a.font_bold,
            a.text_lg,
            t.atoms.text_contrast_medium,
            {color: 'white'},
          ]}>
          You haven't created a starter pack yet!
        </Text>
        <Text style={[a.text_md, {color: 'white'}]}>
          Starter packs let you easily share your favorite feeds and people with
          your friends.
        </Text>
      </View>
      <View style={[a.flex_row, a.gap_md, {marginLeft: 'auto'}]}>
        <Button
          label={_(msg`Create a starter pack for me`)}
          variant="ghost"
          color="primary"
          size="small"
          disabled={isGenerating}
          onPress={confirmDialogControl.open}
          style={{backgroundColor: 'transparent'}}>
          <ButtonText style={{color: 'white'}}>
            <Trans>Make one for me</Trans>
          </ButtonText>
          {isGenerating && <Loader size="md" />}
        </Button>
        <Button
          label={_(msg`Create a starter pack`)}
          variant="ghost"
          color="primary"
          size="small"
          disabled={isGenerating}
          onPress={() => navigation.navigate('StarterPackWizard', {})}
          style={{
            backgroundColor: 'white',
            borderColor: 'white',
            width: 100,
          }}
          hoverStyle={[{backgroundColor: '#dfdfdf'}]}>
          <ButtonText>
            <Trans>Create</Trans>
          </ButtonText>
        </Button>
      </View>

      <Prompt.Outer control={confirmDialogControl}>
        <Prompt.TitleText>
          <Trans>Generate a starter pack?</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>
            You can customize your starter pack with feeds and your favorite
            people if you create your own.
          </Trans>
        </Prompt.DescriptionText>
        <Prompt.Actions>
          <Prompt.Action
            color="primary"
            cta={_(msg`I'll create one`)}
            onPress={() => {
              navigation.navigate('StarterPackWizard', {})
            }}
          />
          <Prompt.Action
            color="secondary"
            cta={_(msg`Generate anyway`)}
            onPress={generate}
          />
        </Prompt.Actions>
      </Prompt.Outer>
      <Prompt.Basic
        control={followersDialogControl}
        title={_(msg`Oops!`)}
        description={_(
          msg`You must be following at least seven other people to generate a starter pack.`,
        )}
        onConfirm={() => {}}
        showCancel={false}
      />
      <Prompt.Basic
        control={errorDialogControl}
        title={_(msg`Oops!`)}
        description={_(
          msg`An error occurred while generating your starter pack. Want to try again?`,
        )}
        onConfirm={generate}
        confirmButtonCta={_(msg`Retry`)}
      />
    </LinearGradientBackground>
  )
}

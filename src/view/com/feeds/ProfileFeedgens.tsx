import React from 'react'
import {
  findNodeHandle,
  ListRenderItemInfo,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {msg} from '@lingui/macro'
import {Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useGenerateStarterPackMutation} from '#/lib/generate-starterpack'
import {NavigationProp} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {parseStarterPackUri} from '#/lib/strings/starter-pack'
import {logger} from '#/logger'
import {isNative, isWeb} from '#/platform/detection'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {RQKEY, useProfileFeedgensQuery} from '#/state/queries/profile-feedgens'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, ios, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import * as FeedCard from '#/components/FeedCard'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import * as Prompt from '#/components/Prompt'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {List, ListRef} from '../util/List'
import {LoadMoreRetryBtn} from '../util/LoadMoreRetryBtn'

const LOADING = {_reactKey: '__loading__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

interface SectionRef {
  scrollToTop: () => void
}

interface ProfileFeedgensProps {
  did: string
  scrollElRef: ListRef
  headerOffset: number
  enabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  setScrollViewTag: (tag: number | null) => void
  isMe: boolean
}

export const ProfileFeedgens = React.forwardRef<
  SectionRef,
  ProfileFeedgensProps
>(function ProfileFeedgensImpl(
  {
    did,
    scrollElRef,
    headerOffset,
    enabled,
    style,
    testID,
    setScrollViewTag,
    isMe,
  },
  ref,
) {
  const {_} = useLingui()
  const t = useTheme()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const opts = React.useMemo(() => ({enabled}), [enabled])
  const {
    data,
    isFetching,
    isFetched,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useProfileFeedgensQuery(did, opts)
  const isEmpty = !isFetching && !data?.pages[0]?.feeds.length
  const {data: preferences} = usePreferencesQuery()

  const items = React.useMemo(() => {
    let items: any[] = []
    if (isError && isEmpty) {
      items = items.concat([ERROR_ITEM])
    }
    if (!isFetched && isFetching) {
      items = items.concat([LOADING])
    } else if (isEmpty) {
      // -- handled separately --
    } else if (data?.pages) {
      for (const page of data?.pages) {
        items = items.concat(page.feeds)
      }
    } else if (isError && !isEmpty) {
      items = items.concat([LOAD_MORE_ERROR_ITEM])
    }
    return items
  }, [isError, isEmpty, isFetched, isFetching, data])

  // events
  // =

  const queryClient = useQueryClient()

  const onScrollToTop = React.useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerOffset,
    })
    queryClient.invalidateQueries({queryKey: RQKEY(did)})
  }, [scrollElRef, queryClient, headerOffset, did])

  React.useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh feeds', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return

    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more feeds', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item, index}: ListRenderItemInfo<any>) => {
      if (item === ERROR_ITEM) {
        return (
          <ErrorMessage message={cleanError(error)} onPressTryAgain={refetch} />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label={_(
              msg`There was an issue fetching your lists. Tap here to try again.`,
            )}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING) {
        return <FeedLoadingPlaceholder />
      }
      if (preferences) {
        return (
          <View
            style={[
              (index !== 0 || isWeb) && a.border_t,
              t.atoms.border_contrast_low,
              a.px_lg,
              a.py_lg,
            ]}>
            <FeedCard.Default view={item} />
          </View>
        )
      }
      return null
    },
    [_, t, error, refetch, onPressRetryLoadMore, preferences],
  )

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
        keyExtractor={(item: any) => item._reactKey || item.uri}
        renderItem={renderItem}
        refreshing={isPTRing}
        onRefresh={onRefresh}
        headerOffset={headerOffset}
        progressViewOffset={ios(0)}
        contentContainerStyle={isNative && {paddingBottom: headerOffset + 100}}
        indicatorStyle={t.name === 'light' ? 'black' : 'white'}
        removeClippedSubviews={true}
        // @ts-ignore our .web version only -prf
        desktopFixedHeight
        onEndReached={onEndReached}
        ListEmptyComponent={Empty}
        ListFooterComponent={
          items?.length !== 0 && isMe ? CreateAnother : undefined
        }
      />
    </View>
  )
})

function CreateAnother() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  return (
    <View
      style={[
        a.pr_md,
        a.pt_lg,
        a.gap_lg,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <Button
        label={_(msg`Create a starter pack`)}
        variant="solid"
        color="secondary"
        size="small"
        style={[a.self_center]}
        onPress={() => navigation.navigate('StarterPackWizard')}>
        <ButtonText>
          <Trans>Create another</Trans>
        </ButtonText>
        <ButtonIcon icon={Plus} position="right" />
      </Button>
    </View>
  )
}

function Empty() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const confirmDialogControl = useDialogControl()
  const followersDialogControl = useDialogControl()
  const errorDialogControl = useDialogControl()

  const [isGenerating, setIsGenerating] = React.useState(false)

  const {mutate: generateStarterPack} = useGenerateStarterPackMutation({
    onSuccess: ({uri}) => {
      const parsed = parseStarterPackUri(uri)
      if (parsed) {
        navigation.push('StarterPack', {
          name: parsed.name,
          rkey: parsed.rkey,
        })
      }
      setIsGenerating(false)
    },
    onError: e => {
      logger.error('Failed to generate starter pack', {safeMessage: e})
      setIsGenerating(false)
      if (e.name === 'NOT_ENOUGH_FOLLOWERS') {
        followersDialogControl.open()
      } else {
        errorDialogControl.open()
      }
    },
  })

  const generate = () => {
    setIsGenerating(true)
    generateStarterPack()
  }

  return (
    <LinearGradientBackground
      style={[
        a.px_lg,
        a.py_lg,
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
          <Trans>You haven't created a feed yet!</Trans>
        </Text>
        <Text style={[a.text_md, {color: 'white'}]}>
          <Trans>
            Create a feed to curate your own and others people's posts.
          </Trans>
        </Text>
      </View>
      <View style={[a.flex_row, a.gap_md, {marginLeft: 'auto'}]}>
        <Button
          label={_(msg`Create a starter pack`)}
          variant="ghost"
          color="primary"
          size="small"
          disabled={isGenerating}
          onPress={() => navigation.navigate('StarterPackWizard')}
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
          <Trans>Generate a starter pack</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>
            Bluesky will choose a set of recommended accounts from people in
            your network.
          </Trans>
        </Prompt.DescriptionText>
        <Prompt.Actions>
          <Prompt.Action
            color="primary"
            cta={_(msg`Choose for me`)}
            onPress={generate}
          />
          <Prompt.Action
            color="secondary"
            cta={_(msg`Let me choose`)}
            onPress={() => {
              navigation.navigate('StarterPackWizard')
            }}
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

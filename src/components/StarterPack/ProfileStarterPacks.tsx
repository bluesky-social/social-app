import {useCallback, useEffect, useImperativeHandle, useState} from 'react'
import {
  type ListRenderItemInfo,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useGenerateStarterPackMutation} from '#/lib/generate-starterpack'
import {useBottomBarOffset} from '#/lib/hooks/useBottomBarOffset'
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {type NavigationProp} from '#/lib/routes/types'
import {parseStarterPackUri} from '#/lib/strings/starter-pack'
import {logger} from '#/logger'
import {useActorStarterPacksQuery} from '#/state/queries/actor-starter-packs'
import {
  EmptyState,
  type EmptyStateButtonProps,
} from '#/view/com/util/EmptyState'
import {List, type ListRef} from '#/view/com/util/List'
import {findListNativeTag} from '#/view/com/util/listNativeTag'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, ios, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {LinearGradientBackground} from '#/components/LinearGradientBackground'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {Default as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type app} from '#/lexicons'

interface SectionRef {
  scrollToTop: () => void
}

interface ProfileFeedgensProps {
  ref?: React.Ref<SectionRef>
  scrollElRef: ListRef
  did: string
  headerOffset: number
  enabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  setScrollViewTag: (tag: number | null) => void
  isMe: boolean
  emptyStateMessage?: string
  emptyStateButton?: EmptyStateButtonProps
  emptyStateIcon?: React.ComponentType | React.ReactElement
}

function keyExtractor(item: app.bsky.graph.defs.StarterPackViewBasic) {
  return item.uri
}

export function ProfileStarterPacks({
  ref,
  scrollElRef,
  did,
  headerOffset,
  enabled,
  style,
  testID,
  setScrollViewTag,
  isMe,
  emptyStateMessage,
  emptyStateButton,
  emptyStateIcon,
}: ProfileFeedgensProps) {
  const t = useTheme()
  const bottomBarOffset = useBottomBarOffset(100)
  const {height} = useWindowDimensions()
  const [isPTRing, setIsPTRing] = useState(false)
  const {
    data,
    refetch,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useActorStarterPacksQuery({did, enabled})
  const {isTabletOrDesktop} = useWebMediaQueries()

  const items = data?.pages.flatMap(page => page.starterPacks)
  const {t: l} = useLingui()

  const EmptyComponent = useCallback(() => {
    if (emptyStateMessage || emptyStateButton || emptyStateIcon) {
      return (
        <View style={[a.px_lg, a.align_center, a.justify_center]}>
          <EmptyState
            icon={emptyStateIcon}
            iconSize="3xl"
            message={
              emptyStateMessage ??
              l`Starter Packs let you share your favorite feeds and people with your friends.`
            }
            button={emptyStateButton}
          />
        </View>
      )
    }
    return <Empty />
  }, [l, emptyStateMessage, emptyStateButton, emptyStateIcon])

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {},
  }))

  const onRefresh = useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh Starter Packs', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more Starter Packs', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  useEffect(() => {
    if (IS_IOS && enabled && scrollElRef.current) {
      const nativeTag = findListNativeTag(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [enabled, scrollElRef, setScrollViewTag])

  const renderItem = useCallback(
    ({
      item,
      index,
    }: ListRenderItemInfo<app.bsky.graph.defs.StarterPackViewBasic>) => {
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
    },
    [isTabletOrDesktop, t.atoms.border_contrast_low],
  )

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
        progressViewOffset={ios(0)}
        contentContainerStyle={{
          minHeight: height + headerOffset,
          paddingBottom: bottomBarOffset,
        }}
        removeClippedSubviews={true}
        desktopFixedHeight
        onEndReached={() => void onEndReached()}
        onRefresh={() => void onRefresh()}
        ListEmptyComponent={
          data ? (isMe ? EmptyComponent : undefined) : FeedLoadingPlaceholder
        }
        ListFooterComponent={
          !!data && items?.length !== 0 && isMe ? CreateAnother : undefined
        }
      />
    </View>
  )
}

function CreateAnother() {
  const {t: l} = useLingui()
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
        label={l`Create a Starter Pack`}
        variant="solid"
        color="secondary"
        size="small"
        style={[a.self_center]}
        onPress={() => navigation.navigate('StarterPackWizard', {})}>
        <ButtonText>
          <Trans>Create another</Trans>
        </ButtonText>
        <ButtonIcon icon={Plus} position="right" />
      </Button>
    </View>
  )
}

function Empty() {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const confirmDialogControl = useDialogControl()
  const followersDialogControl = useDialogControl()
  const errorDialogControl = useDialogControl()
  const requireEmailVerification = useRequireEmailVerification()

  const [isGenerating, setIsGenerating] = useState(false)

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
      logger.error('Failed to generate Starter Pack', {safeMessage: e})
      setIsGenerating(false)
      if (e.message.includes('NOT_ENOUGH_FOLLOWERS')) {
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

  const openConfirmDialog = useCallback(() => {
    confirmDialogControl.open()
  }, [confirmDialogControl])
  const wrappedOpenConfirmDialog = requireEmailVerification(openConfirmDialog, {
    instructions: [
      <Trans key="confirm">
        Before creating a Starter Pack, you must first verify your email.
      </Trans>,
    ],
  })
  const navToWizard = useCallback(() => {
    navigation.navigate('StarterPackWizard', {})
  }, [navigation])
  const wrappedNavToWizard = requireEmailVerification(navToWizard, {
    instructions: [
      <Trans key="nav">
        Before creating a Starter Pack, you must first verify your email.
      </Trans>,
    ],
  })

  return (
    <LinearGradientBackground
      style={[
        a.px_lg,
        a.py_lg,
        a.justify_between,
        a.gap_lg,
        a.shadow_lg,
        {marginTop: a.border.borderWidth},
      ]}>
      <View style={[a.gap_xs]}>
        <Text style={[a.font_semi_bold, a.text_lg, {color: 'white'}]}>
          <Trans>You haven't created a Starter Pack yet!</Trans>
        </Text>
        <Text style={[a.text_md, {color: 'white'}]}>
          <Trans>
            Starter Packs let you easily share your favorite feeds and people
            with your friends.
          </Trans>
        </Text>
      </View>
      <View style={[a.flex_row, a.gap_md, {marginLeft: 'auto'}]}>
        <Button
          label={l`Create a Starter Pack for me`}
          variant="ghost"
          color="primary"
          size="small"
          disabled={isGenerating}
          onPress={wrappedOpenConfirmDialog}
          style={{backgroundColor: 'transparent'}}>
          <ButtonText style={{color: 'white'}}>
            <Trans>Make one for me</Trans>
          </ButtonText>
          {isGenerating && <Loader size="md" />}
        </Button>
        <Button
          label={l`Create a Starter Pack`}
          variant="ghost"
          color="primary"
          size="small"
          disabled={isGenerating}
          onPress={wrappedNavToWizard}
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
        <Prompt.Content>
          <Prompt.TitleText>
            <Trans>Generate a Starter Pack</Trans>
          </Prompt.TitleText>
          <Prompt.DescriptionText>
            <Trans>
              Bluesky will choose a set of recommended accounts from people in
              your network.
            </Trans>
          </Prompt.DescriptionText>
        </Prompt.Content>
        <Prompt.Actions>
          <Prompt.Action
            color="primary"
            cta={l`Choose for me`}
            onPress={generate}
          />
          <Prompt.Action
            color="secondary"
            cta={l`Let me choose`}
            onPress={() => {
              navigation.navigate('StarterPackWizard', {})
            }}
          />
        </Prompt.Actions>
      </Prompt.Outer>
      <Prompt.Basic
        control={followersDialogControl}
        title={l`Oops!`}
        description={l`You must be following at least seven other people to generate a Starter Pack.`}
        onConfirm={() => {}}
        showCancel={false}
      />
      <Prompt.Basic
        control={errorDialogControl}
        title={l`Oops!`}
        description={l`An error occurred while generating your Starter Pack. Want to try again?`}
        onConfirm={generate}
        confirmButtonCta={l`Retry`}
      />
    </LinearGradientBackground>
  )
}

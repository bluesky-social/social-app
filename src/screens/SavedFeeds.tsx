import {useCallback, useState} from 'react'
import {View} from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedRef,
  useAnimatedStyle,
} from 'react-native-reanimated'
import Sortable, {useItemContext} from 'react-native-sortables'
import {type AppBskyActorDefs} from '@atproto/api'
import {TID} from '@atproto/common-web'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {RECOMMENDED_SAVED_FEEDS, TIMELINE_SAVED_FEED} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {
  useOverwriteSavedFeedsMutation,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useSetMinimalShellMode} from '#/state/shell'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import * as Toast from '#/view/com/util/Toast'
import {NoFollowingFeed} from '#/screens/Feeds/NoFollowingFeed'
import {NoSavedFeedsOfAnyType} from '#/screens/Feeds/NoSavedFeedsOfAnyType'
import {atoms as a, useBreakpoints, useTheme, type ViewStyleProp} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DotGrid2x3_Stroke2_Corner0_Rounded as HandleIcon} from '#/components/icons/DotGrid'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
import {FloppyDisk_Stroke2_Corner0_Rounded as SaveIcon} from '#/components/icons/FloppyDisk'
import {Pin_Filled_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>
export function SavedFeeds({}: Props) {
  const {data: preferences} = usePreferencesQuery()
  if (!preferences) {
    return <View />
  }
  return <SavedFeedsInner preferences={preferences} />
}

function SavedFeedsInner({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {mutateAsync: overwriteSavedFeeds, isPending: isOverwritePending} =
    useOverwriteSavedFeedsMutation()
  const navigation = useNavigation<NavigationProp>()
  const scrollviewAnimRef = useAnimatedRef<Animated.ScrollView>()

  /*
   * Use optimistic data if exists and no error, otherwise fallback to remote
   * data
   */
  const [currentFeeds, setCurrentFeeds] = useState(
    () => preferences.savedFeeds || [],
  )
  const hasUnsavedChanges = currentFeeds !== preferences.savedFeeds
  const pinnedFeeds = currentFeeds.filter(f => f.pinned)
  const unpinnedFeeds = currentFeeds.filter(f => !f.pinned)
  const noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0
  const noFollowingFeed =
    currentFeeds.every(f => f.type !== 'timeline') && !noSavedFeedsOfAnyType

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  const onSaveChanges = async () => {
    try {
      await overwriteSavedFeeds(currentFeeds)
      Toast.show(_(msg({message: 'Feeds updated!', context: 'toast'})))
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Feeds')
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), 'xmark')
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Feeds</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          testID="saveChangesBtn"
          size="small"
          color={hasUnsavedChanges ? 'primary' : 'secondary'}
          onPress={onSaveChanges}
          label={_(msg`Save changes`)}
          disabled={isOverwritePending || !hasUnsavedChanges}>
          <ButtonIcon icon={isOverwritePending ? Loader : SaveIcon} />
          <ButtonText>
            {gtMobile ? <Trans>Save changes</Trans> : <Trans>Save</Trans>}
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <Layout.Content ref={scrollviewAnimRef}>
        {noSavedFeedsOfAnyType && (
          <View style={[t.atoms.border_contrast_low, a.border_b]}>
            <NoSavedFeedsOfAnyType
              onAddRecommendedFeeds={() =>
                setCurrentFeeds(
                  RECOMMENDED_SAVED_FEEDS.map(f => ({
                    ...f,
                    id: TID.nextStr(),
                  })),
                )
              }
            />
          </View>
        )}

        <SectionHeaderText>
          <Trans>Pinned Feeds</Trans>
        </SectionHeaderText>

        {preferences ? (
          !pinnedFeeds.length ? (
            <View style={[a.flex_1, a.p_lg]}>
              <Admonition type="info">
                <Trans>You don't have any pinned feeds.</Trans>
              </Admonition>
            </View>
          ) : (
            <Sortable.Grid
              data={pinnedFeeds}
              keyExtractor={item => item.id}
              overDrag="vertical"
              activeItemScale={1.03}
              scrollableRef={scrollviewAnimRef}
              onActiveItemDropped={newOrder => {
                const hasChanged = newOrder.fromIndex !== newOrder.toIndex
                if (hasChanged) {
                  const newData = [...pinnedFeeds]
                  const movedItem = newData.splice(newOrder.fromIndex, 1)[0]
                  newData.splice(newOrder.toIndex, 0, movedItem)

                  // Merge back with unpinned feeds
                  const updatedFeeds = [...newData, ...unpinnedFeeds]
                  setCurrentFeeds(updatedFeeds)
                }
              }}
              hapticsEnabled={true}
              customHandle
              renderItem={({item}) => (
                <DraggableCardWrapper key={item.id}>
                  <ListItem
                    feed={item}
                    isPinned
                    currentFeeds={currentFeeds}
                    setCurrentFeeds={setCurrentFeeds}
                    noBorder
                  />
                </DraggableCardWrapper>
              )}
            />
          )
        ) : (
          <View style={[a.w_full, a.py_2xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        )}

        {noFollowingFeed && (
          <View style={[t.atoms.border_contrast_low, a.border_b]}>
            <NoFollowingFeed
              onAddFeed={() =>
                setCurrentFeeds(feeds => [
                  ...feeds,
                  {...TIMELINE_SAVED_FEED, id: TID.next().toString()},
                ])
              }
            />
          </View>
        )}

        <SectionHeaderText>
          <Trans>Saved Feeds</Trans>
        </SectionHeaderText>

        {preferences ? (
          !unpinnedFeeds.length ? (
            <View style={[a.flex_1, a.p_lg]}>
              <Admonition type="info">
                <Trans>You don't have any saved feeds.</Trans>
              </Admonition>
            </View>
          ) : (
            unpinnedFeeds.map(f => (
              <ListItem
                key={f.id}
                feed={f}
                isPinned={false}
                currentFeeds={currentFeeds}
                setCurrentFeeds={setCurrentFeeds}
              />
            ))
          )
        ) : (
          <View style={[a.w_full, a.py_2xl, a.align_center]}>
            <Loader size="xl" />
          </View>
        )}

        <View style={[a.px_lg, a.py_xl]}>
          <Text
            style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              Feeds are custom algorithms that users build with a little coding
              expertise.{' '}
              <InlineLinkText
                to="https://github.com/bluesky-social/feed-generator"
                label={_(msg`See this guide`)}
                disableMismatchWarning
                style={[a.leading_snug]}>
                See this guide
              </InlineLinkText>{' '}
              for more information.
            </Trans>
          </Text>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function ListItem({
  feed,
  isPinned,
  currentFeeds,
  setCurrentFeeds,
  noBorder,
}: {
  feed: AppBskyActorDefs.SavedFeed
  isPinned: boolean
  currentFeeds: AppBskyActorDefs.SavedFeed[]
  setCurrentFeeds: React.Dispatch<AppBskyActorDefs.SavedFeed[]>
  noBorder?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const feedUri = feed.value

  const onTogglePinned = async () => {
    playHaptic()
    setCurrentFeeds(
      currentFeeds.map(f =>
        f.id === feed.id ? {...feed, pinned: !feed.pinned} : f,
      ),
    )
  }

  const onPressRemove = async () => {
    playHaptic()
    setCurrentFeeds(currentFeeds.filter(f => f.id !== feed.id))
  }

  return (
    <View
      style={[
        a.flex_row,
        !noBorder && [a.border_b, t.atoms.border_contrast_low],
      ]}>
      {isPinned && (
        <View style={[a.flex_row, a.align_center]}>
          <Sortable.Handle>
            <View
              style={[
                a.justify_center,
                a.align_center,
                a.pl_lg,
                a.pr_md,
                a.h_full,
              ]}>
              <HandleIcon fill={t.palette.contrast_400} />
            </View>
          </Sortable.Handle>
        </View>
      )}
      {feed.type === 'timeline' ? (
        <FollowingFeedCard style={[isPinned && a.pl_0]} />
      ) : (
        <FeedSourceCard
          key={feedUri}
          feedUri={feedUri}
          style={[isPinned && [a.pr_sm, a.pl_0]]}
          showMinimalPlaceholder
          hideTopBorder={true}
        />
      )}
      <View style={[a.pr_lg, a.flex_row, a.align_center, a.gap_sm]}>
        {!isPinned && (
          <Button
            testID={`feed-${feedUri}-toggleSave`}
            label={_(msg`Remove from my feeds`)}
            onPress={onPressRemove}
            size="small"
            color="secondary"
            variant="ghost"
            shape="square">
            <ButtonIcon icon={TrashIcon} />
          </Button>
        )}
        <Button
          testID={`feed-${feed.type}-togglePin`}
          label={isPinned ? _(msg`Unpin feed`) : _(msg`Pin feed`)}
          onPress={onTogglePinned}
          size="small"
          color={isPinned ? 'primary_subtle' : 'secondary'}
          shape="square">
          <ButtonIcon icon={PinIcon} />
        </Button>
      </View>
    </View>
  )
}

function DraggableCardWrapper({children}: {children: React.ReactNode}) {
  const {activationAnimationProgress} = useItemContext()
  const t = useTheme()

  const borderColor = t.atoms.border_contrast_low.borderColor
  const transparentBorderColor = t.atoms.bg.backgroundColor
  const borderOpacityStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        activationAnimationProgress.get(),
        [0, 1],
        [borderColor, transparentBorderColor],
      ),
    }
  })

  return (
    <Animated.View style={[a.border_b, t.atoms.bg, borderOpacityStyle]}>
      {children}
    </Animated.View>
  )
}

function SectionHeaderText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <View
      style={[
        a.flex_row,
        a.flex_1,
        a.px_lg,
        a.pt_2xl,
        a.pb_md,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <Text style={[a.text_xl, a.font_bold, a.leading_snug]}>{children}</Text>
    </View>
  )
}

function FollowingFeedCard({style}: ViewStyleProp) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.flex_1, a.p_lg, style]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_sm,
          a.mr_md,
          {
            width: 36,
            height: 36,
            backgroundColor: t.palette.primary_500,
          },
        ]}>
        <FilterTimeline
          style={[
            {
              width: 22,
              height: 22,
            },
          ]}
          fill={t.palette.white}
        />
      </View>
      <View style={[a.flex_1, a.flex_row, a.gap_sm, a.align_center]}>
        <Text style={[a.text_sm, a.font_semi_bold, a.leading_snug]}>
          <Trans context="feed-name">Following</Trans>
        </Text>
      </View>
    </View>
  )
}

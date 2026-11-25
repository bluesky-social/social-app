import {useEffect, useRef, useState} from 'react'
import {AccessibilityInfo, View} from 'react-native'
import type Animated from 'react-native-reanimated'
import {useAnimatedRef, useScrollOffset} from 'react-native-reanimated'
import {TID} from '@atproto/common-web'
import {AtUri} from '@atproto/syntax'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans, useLingui as useLinguiMacro} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {RECOMMENDED_SAVED_FEEDS, TIMELINE_SAVED_FEED} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useA11y} from '#/state/a11y'
import {
  useOverwriteSavedFeedsMutation,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {FeedSourceCard} from '#/view/com/feeds/FeedSourceCard'
import {NoFollowingFeed} from '#/screens/Feeds/NoFollowingFeed'
import {NoSavedFeedsOfAnyType} from '#/screens/Feeds/NoSavedFeedsOfAnyType'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {SortableList} from '#/components/DraggableList'
import {
  ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon,
  ArrowTop_Stroke2_Corner0_Rounded as ArrowUpIcon,
} from '#/components/icons/Arrow'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimelineIcon} from '#/components/icons/Filter'
import {FloppyDisk_Stroke2_Corner0_Rounded as SaveIcon} from '#/components/icons/FloppyDisk'
import {Pin_Filled_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type app} from '#/lexicons'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SavedFeeds'>
export function SavedFeeds({}: Props) {
  const {data: preferences} = usePreferencesQuery()
  const {screenReaderEnabled} = useA11y()
  if (!preferences) {
    return <View />
  }
  if (screenReaderEnabled) {
    return <SavedFeedsA11y preferences={preferences} />
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
  const {mutateAsync: overwriteSavedFeeds, isPending: isOverwritePending} =
    useOverwriteSavedFeedsMutation()
  const navigation = useNavigation<NavigationProp>()
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollOffset(scrollRef)

  /*
   * Use optimistic data if exists and no error, otherwise fallback to remote
   * data
   */
  const {currentFeeds, setCurrentFeeds, invalidCount, removedInvalidCount} =
    useSavedFeedsDraft(preferences)
  const hasUnsavedChanges = currentFeeds !== preferences.savedFeeds
  const pinnedFeeds = currentFeeds.filter(f => f.pinned)
  const unpinnedFeeds = currentFeeds.filter(f => !f.pinned)
  const noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0
  const noFollowingFeed =
    currentFeeds.every(f => f.type !== 'timeline') && !noSavedFeedsOfAnyType
  const [isDragging, setIsDragging] = useState(false)

  const onSaveChanges = async () => {
    if (invalidCount > 0) return

    try {
      await overwriteSavedFeeds(currentFeeds)
      Toast.show(_(msg({message: 'Feeds updated!', context: 'toast'})))
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Feeds')
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), {
        type: 'error',
      })
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
          disabled={
            isOverwritePending || !hasUnsavedChanges || invalidCount > 0
          }>
          <ButtonIcon icon={isOverwritePending ? Loader : SaveIcon} />
          <ButtonText>
            {gtMobile ? <Trans>Save changes</Trans> : <Trans>Save</Trans>}
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <Layout.Content ref={scrollRef} scrollEnabled={!isDragging}>
        <InvalidFeedsNotice
          invalidCount={invalidCount}
          removedCount={removedInvalidCount}
        />
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
            <SortableList
              data={pinnedFeeds}
              keyExtractor={f => f.id}
              itemHeight={68}
              scrollRef={scrollRef}
              scrollOffset={scrollOffset}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onReorder={reordered => {
                setCurrentFeeds([...reordered, ...unpinnedFeeds])
              }}
              renderItem={(feed, dragHandle) => (
                <PinnedFeedItem
                  feed={feed}
                  currentFeeds={currentFeeds}
                  setCurrentFeeds={setCurrentFeeds}
                  dragHandle={dragHandle}
                />
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
              <UnpinnedFeedItem
                key={f.id}
                feed={f}
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

function SavedFeedsA11y({
  preferences,
}: {
  preferences: UsePreferencesQueryResponse
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {mutateAsync: overwriteSavedFeeds, isPending: isOverwritePending} =
    useOverwriteSavedFeedsMutation()
  const navigation = useNavigation<NavigationProp>()

  const {currentFeeds, setCurrentFeeds, invalidCount, removedInvalidCount} =
    useSavedFeedsDraft(preferences)
  const hasUnsavedChanges = currentFeeds !== preferences.savedFeeds
  const pinnedFeeds = currentFeeds.filter(f => f.pinned)
  const unpinnedFeeds = currentFeeds.filter(f => !f.pinned)
  const noSavedFeedsOfAnyType = pinnedFeeds.length + unpinnedFeeds.length === 0
  const noFollowingFeed =
    currentFeeds.every(f => f.type !== 'timeline') && !noSavedFeedsOfAnyType

  const onSaveChanges = async () => {
    if (invalidCount > 0) return

    try {
      await overwriteSavedFeeds(currentFeeds)
      Toast.show(_(msg({message: 'Feeds updated!', context: 'toast'})))
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.navigate('Feeds')
      }
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), {
        type: 'error',
      })
      logger.error('Failed to toggle pinned feed', {message: e})
    }
  }

  const onMoveUp = (index: number) => {
    const pinned = [...pinnedFeeds]
    ;[pinned[index - 1], pinned[index]] = [pinned[index], pinned[index - 1]]
    setCurrentFeeds([...pinned, ...unpinnedFeeds])
  }

  const onMoveDown = (index: number) => {
    const pinned = [...pinnedFeeds]
    ;[pinned[index], pinned[index + 1]] = [pinned[index + 1], pinned[index]]
    setCurrentFeeds([...pinned, ...unpinnedFeeds])
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
          disabled={
            isOverwritePending || !hasUnsavedChanges || invalidCount > 0
          }>
          <ButtonIcon icon={isOverwritePending ? Loader : SaveIcon} />
          <ButtonText>
            {gtMobile ? <Trans>Save changes</Trans> : <Trans>Save</Trans>}
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <Layout.Content>
        <InvalidFeedsNotice
          invalidCount={invalidCount}
          removedCount={removedInvalidCount}
        />
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

        {!pinnedFeeds.length ? (
          <View style={[a.flex_1, a.p_lg]}>
            <Admonition type="info">
              <Trans>You don't have any pinned feeds.</Trans>
            </Admonition>
          </View>
        ) : (
          pinnedFeeds.map((feed, i) => (
            <PinnedFeedItem
              key={feed.id}
              feed={feed}
              currentFeeds={currentFeeds}
              setCurrentFeeds={setCurrentFeeds}
              index={i}
              total={pinnedFeeds.length}
              onMoveUp={() => onMoveUp(i)}
              onMoveDown={() => onMoveDown(i)}
            />
          ))
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

        {!unpinnedFeeds.length ? (
          <View style={[a.flex_1, a.p_lg]}>
            <Admonition type="info">
              <Trans>You don't have any saved feeds.</Trans>
            </Admonition>
          </View>
        ) : (
          unpinnedFeeds.map(f => (
            <UnpinnedFeedItem
              key={f.id}
              feed={f}
              currentFeeds={currentFeeds}
              setCurrentFeeds={setCurrentFeeds}
            />
          ))
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

function PinnedFeedItem({
  feed,
  currentFeeds,
  setCurrentFeeds,
  dragHandle,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: {
  feed: app.bsky.actor.defs.SavedFeed
  currentFeeds: app.bsky.actor.defs.SavedFeed[]
  setCurrentFeeds: React.Dispatch<
    React.SetStateAction<app.bsky.actor.defs.SavedFeed[]>
  >
  dragHandle?: React.ReactNode
  index?: number
  total?: number
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const feedUri = feed.value
  const isInvalid = isInvalidSavedFeed(feed)

  const onTogglePinned = () => {
    haptics.confirm()
    setCurrentFeeds(
      currentFeeds.map(f =>
        f.id === feed.id ? {...feed, pinned: !feed.pinned} : f,
      ),
    )
  }

  return (
    <View style={[a.flex_row, t.atoms.bg]}>
      {feed.type === 'timeline' ? (
        <FollowingFeedCard />
      ) : isInvalid ? (
        <InvalidFeedCard type={feed.type} />
      ) : (
        <FeedSourceCard
          feedUri={feedUri}
          style={[a.pr_sm]}
          showMinimalPlaceholder
          hideTopBorder={true}
        />
      )}
      <View style={[a.pr_sm, a.flex_row, a.align_center, a.gap_sm]}>
        <Button
          testID={
            isInvalid
              ? `feed-${feed.id}-removeInvalid`
              : `feed-${feed.type}-togglePin`
          }
          label={isInvalid ? _(msg`Remove from my feeds`) : _(msg`Unpin feed`)}
          onPress={
            isInvalid
              ? () => {
                  haptics.confirm()
                  setCurrentFeeds(feeds => feeds.filter(f => f.id !== feed.id))
                }
              : onTogglePinned
          }
          size="small"
          color={isInvalid ? 'secondary' : 'primary_subtle'}
          shape="square">
          <ButtonIcon icon={isInvalid ? TrashIcon : PinIcon} />
        </Button>
        {onMoveUp !== undefined ? (
          <>
            <Button
              testID={`feed-${feed.type}-moveUp`}
              label={_(msg`Move feed up`)}
              onPress={onMoveUp}
              disabled={index === 0}
              size="small"
              color="secondary"
              shape="square">
              <ButtonIcon icon={ArrowUpIcon} />
            </Button>
            <Button
              testID={`feed-${feed.type}-moveDown`}
              label={_(msg`Move feed down`)}
              onPress={onMoveDown}
              disabled={index === total! - 1}
              size="small"
              color="secondary"
              shape="square">
              <ButtonIcon icon={ArrowDownIcon} />
            </Button>
          </>
        ) : (
          dragHandle
        )}
      </View>
    </View>
  )
}

function UnpinnedFeedItem({
  feed,
  currentFeeds,
  setCurrentFeeds,
}: {
  feed: app.bsky.actor.defs.SavedFeed
  currentFeeds: app.bsky.actor.defs.SavedFeed[]
  setCurrentFeeds: React.Dispatch<
    React.SetStateAction<app.bsky.actor.defs.SavedFeed[]>
  >
}) {
  const {_} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const feedUri = feed.value
  const isInvalid = isInvalidSavedFeed(feed)

  const onTogglePinned = () => {
    haptics.confirm()
    setCurrentFeeds(
      currentFeeds.map(f =>
        f.id === feed.id ? {...feed, pinned: !feed.pinned} : f,
      ),
    )
  }

  const onPressRemove = () => {
    haptics.confirm()
    setCurrentFeeds(currentFeeds.filter(f => f.id !== feed.id))
  }

  return (
    <View style={[a.flex_row, a.border_b, t.atoms.border_contrast_low]}>
      {feed.type === 'timeline' ? (
        <FollowingFeedCard />
      ) : isInvalid ? (
        <InvalidFeedCard type={feed.type} />
      ) : (
        <FeedSourceCard
          feedUri={feedUri}
          showMinimalPlaceholder
          hideTopBorder={true}
        />
      )}
      <View style={[a.pr_lg, a.flex_row, a.align_center, a.gap_sm]}>
        <Button
          testID={
            isInvalid
              ? `feed-${feed.id}-removeInvalid`
              : `feed-${feedUri}-toggleSave`
          }
          label={_(msg`Remove from my feeds`)}
          onPress={onPressRemove}
          size="small"
          color="secondary"
          variant="ghost"
          shape="square">
          <ButtonIcon icon={TrashIcon} />
        </Button>
        {!isInvalid && (
          <Button
            testID={`feed-${feed.type}-togglePin`}
            label={_(msg`Pin feed`)}
            onPress={onTogglePinned}
            size="small"
            color="secondary"
            shape="square">
            <ButtonIcon icon={PinIcon} />
          </Button>
        )}
      </View>
    </View>
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

function FollowingFeedCard() {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.align_center, a.flex_1, a.p_lg]}>
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
        <FilterTimelineIcon
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

/** Matches the SDK's saved-feed URI checks before rendering or saving a draft. */
function isInvalidSavedFeed(feed: app.bsky.actor.defs.SavedFeed) {
  if (feed.type === 'timeline') return false

  let uri: AtUri
  try {
    uri = new AtUri(feed.value)
  } catch {
    return true
  }
  return (
    uri.collection !==
    (feed.type === 'feed' ? 'app.bsky.feed.generator' : 'app.bsky.graph.list')
  )
}

/** Shares cleanup tracking between the sortable and screen-reader layouts. */
function useSavedFeedsDraft(preferences: UsePreferencesQueryResponse) {
  const [currentFeeds, setCurrentFeeds] = useState(() => preferences.savedFeeds)
  const [initialInvalidIds] = useState(() =>
    preferences.savedFeeds.filter(isInvalidSavedFeed).map(feed => feed.id),
  )
  const currentIds = new Set(currentFeeds.map(feed => feed.id))
  return {
    currentFeeds,
    setCurrentFeeds,
    invalidCount: currentFeeds.filter(isInvalidSavedFeed).length,
    removedInvalidCount: initialInvalidIds.filter(id => !currentIds.has(id))
      .length,
  }
}

function InvalidFeedsNotice({
  invalidCount,
  removedCount,
}: {
  invalidCount: number
  removedCount: number
}) {
  const {t: l} = useLinguiMacro()
  const {screenReaderEnabled} = useA11y()
  const removedMessage =
    removedCount > 0
      ? plural(removedCount, {
          one: '# invalid saved feed marked for removal. Save your changes to apply.',
          other:
            '# invalid saved feeds marked for removal. Save your changes to apply.',
        })
      : ''
  const remainingMessage =
    invalidCount > 0
      ? l`Some saved feeds are invalid. Remove them before saving your changes.`
      : ''
  const message = [removedMessage, remainingMessage].filter(Boolean).join(' ')
  const previousMessage = useRef(message)

  /** React Native doesn’t support accessibilityLiveRegion="polite" on iOS. */
  useEffect(() => {
    if (
      IS_IOS &&
      screenReaderEnabled &&
      message &&
      message !== previousMessage.current
    ) {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: true,
      })
    }
    previousMessage.current = message
  }, [message, screenReaderEnabled])

  return (
    <View accessibilityLiveRegion="polite" style={message ? a.p_lg : undefined}>
      {message ? (
        <Admonition type={invalidCount > 0 ? 'warning' : 'info'}>
          {message}
        </Admonition>
      ) : null}
    </View>
  )
}

function InvalidFeedCard({
  type,
}: {
  type: app.bsky.actor.defs.SavedFeed['type']
}) {
  const t = useTheme()
  const {t: l} = useLinguiMacro()
  const title = type === 'list' ? l`Invalid saved list` : l`Invalid saved feed`
  const description = l`Remove this entry to continue.`
  return (
    <View
      accessible
      accessibilityLabel={l`${title}. ${description}`}
      accessibilityHint=""
      style={[a.flex_1, a.flex_row, a.align_center, a.p_lg, a.pr_sm]}>
      <View
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_sm,
          a.mr_md,
          t.atoms.bg_contrast_25,
          {width: 36, height: 36},
        ]}>
        <WarningIcon size="lg" />
      </View>
      <View style={[a.flex_1]}>
        <Text
          style={[a.text_sm, a.font_semi_bold, a.leading_snug]}
          numberOfLines={1}>
          {title}
        </Text>
        <Text
          style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {description}
        </Text>
      </View>
    </View>
  )
}

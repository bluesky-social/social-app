import {useCallback, useMemo, useState} from 'react'
import {
  Dimensions,
  type GestureResponderEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {type AppBskyGraphDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListMembersQuery} from '#/state/queries/list-members'
import {useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List, type ListRef} from '#/view/com/util/List'
import {ProfileCardFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {UserAddRemoveListsDialog} from '#/components/dialogs/lists/UserAddRemoveListsDialog'
import {ListFooter} from '#/components/Lists'
import * as ProfileCard from '#/components/ProfileCard'
import type * as bsky from '#/types/bsky'

const LOADING_ITEM = {kind: 'loading', _reactKey: '__loading__'} as const
const EMPTY_ITEM = {kind: 'empty', _reactKey: '__empty__'} as const
const ERROR_ITEM = {kind: 'error', _reactKey: '__error__'} as const
const LOAD_MORE_ERROR_ITEM = {
  kind: 'load_more_error',
  _reactKey: '__load_more_error__',
} as const

type Item =
  | typeof LOADING_ITEM
  | typeof EMPTY_ITEM
  | typeof ERROR_ITEM
  | typeof LOAD_MORE_ERROR_ITEM
  | {
      kind: 'list_item'
      listItem: AppBskyGraphDefs.ListItemView
    }

export function ListMembers({
  list,
  style,
  scrollElRef,
  onScrolledDownChange,
  onPressTryAgain,
  renderHeader,
  renderEmptyState,
  testID,
  headerOffset = 0,
  desktopFixedHeightOffset,
}: {
  list: string
  style?: StyleProp<ViewStyle>
  scrollElRef?: ListRef
  onScrolledDownChange: (isScrolledDown: boolean) => void
  onPressTryAgain?: () => void
  renderHeader: () => React.ReactElement
  renderEmptyState: () => React.ReactElement
  testID?: string
  headerOffset?: number
  desktopFixedHeightOffset?: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()
  const editListsDialogControl = useDialogControl()
  const [selectedProfile, setSelectedProfile] = useState<
    bsky.profile.AnyProfileView | undefined
  >()

  const {
    data,
    isFetching,
    isFetched,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListMembersQuery(list)
  const isEmpty = !isFetching && !data?.pages[0].items.length
  const isOwner =
    currentAccount && data?.pages[0].list.creator.did === currentAccount.did

  const items = useMemo(() => {
    const items: Item[] = []
    if (isFetched) {
      if (isEmpty && isError) {
        items.push(ERROR_ITEM)
      }
      if (isEmpty) {
        items.push(EMPTY_ITEM)
      } else if (data) {
        for (const page of data.pages) {
          items.push(
            ...page.items.map(item => ({
              kind: 'list_item' as const,
              listItem: item,
            })),
          )
        }
      }
      if (!isEmpty && isError) {
        items.push(LOAD_MORE_ERROR_ITEM)
      }
    } else if (isFetching) {
      items.push(LOADING_ITEM)
    }
    return items
  }, [isFetched, isEmpty, isError, data, isFetching])

  // events
  // =

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh lists', {message: err})
    }
    setIsRefreshing(false)
  }, [refetch, setIsRefreshing])

  const onEndReached = useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more lists', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  const onPressEditMembership = useCallback(
    (e: GestureResponderEvent, profile: bsky.profile.AnyProfileView) => {
      e.preventDefault()
      setSelectedProfile(profile)
      editListsDialogControl.open()
    },
    [editListsDialogControl],
  )

  // rendering
  // =

  const renderItem = useCallback(
    ({item}: {item: Item}) => {
      switch (item.kind) {
        case 'empty': {
          return renderEmptyState()
        }
        case 'error': {
          return (
            <ErrorMessage
              message={cleanError(error)}
              onPressTryAgain={onPressTryAgain}
            />
          )
        }
        case 'load_more_error': {
          return (
            <LoadMoreRetryBtn
              label={l`There was an issue fetching the list. Tap here to try again.`}
              onPress={onPressRetryLoadMore}
            />
          )
        }
        case 'loading': {
          return <ProfileCardFeedLoadingPlaceholder />
        }
        case 'list_item': {
          const profile = item.listItem.subject
          if (!moderationOpts) return null

          return (
            <View
              style={[
                a.py_md,
                a.px_xl,
                a.border_t,
                t.atoms.border_contrast_low,
              ]}>
              <ProfileCard.Link profile={profile}>
                <ProfileCard.Outer>
                  <ProfileCard.Header>
                    <ProfileCard.Avatar
                      profile={profile}
                      moderationOpts={moderationOpts}
                    />
                    <ProfileCard.NameAndHandle
                      profile={profile}
                      moderationOpts={moderationOpts}
                    />
                    {isOwner && (
                      <Button
                        testID={`user-${profile.handle}-editBtn`}
                        label={l({message: 'Edit', context: 'action'})}
                        onPress={e => onPressEditMembership(e, profile)}
                        size="small"
                        color="secondary">
                        <ButtonText>
                          <Trans context="action">Edit</Trans>
                        </ButtonText>
                      </Button>
                    )}
                  </ProfileCard.Header>

                  <ProfileCard.Labels
                    profile={profile}
                    moderationOpts={moderationOpts}
                  />

                  <ProfileCard.Description profile={profile} />
                </ProfileCard.Outer>
              </ProfileCard.Link>
            </View>
          )
        }
      }
    },
    [
      renderEmptyState,
      error,
      onPressTryAgain,
      onPressRetryLoadMore,
      moderationOpts,
      isOwner,
      onPressEditMembership,
      l,
      t,
    ],
  )

  const renderFooter = useCallback(() => {
    if (isEmpty) return null
    return (
      <ListFooter
        hasNextPage={hasNextPage}
        error={cleanError(error)}
        isFetchingNextPage={isFetchingNextPage}
        onRetry={fetchNextPage}
        height={180 + headerOffset}
      />
    )
  }, [
    hasNextPage,
    error,
    isFetchingNextPage,
    fetchNextPage,
    isEmpty,
    headerOffset,
  ])

  return (
    <View testID={testID} style={style}>
      <List
        testID={testID ? `${testID}-flatlist` : undefined}
        ref={scrollElRef}
        data={items}
        keyExtractor={(item: Item) =>
          item.kind === 'list_item' ? item.listItem.subject.did : item._reactKey
        }
        renderItem={renderItem}
        ListHeaderComponent={!isEmpty ? renderHeader : undefined}
        ListFooterComponent={renderFooter}
        refreshing={isRefreshing}
        onRefresh={() => void onRefresh()}
        headerOffset={headerOffset}
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}
        onScrolledDownChange={onScrolledDownChange}
        onEndReached={() => void onEndReached()}
        onEndReachedThreshold={0.6}
        removeClippedSubviews={true}
        desktopFixedHeight={desktopFixedHeightOffset || true}
      />

      <UserAddRemoveListsDialog
        control={editListsDialogControl}
        profile={selectedProfile}
      />
    </View>
  )
}

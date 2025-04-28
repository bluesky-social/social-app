import React, {useCallback} from 'react'
import {Dimensions, type StyleProp, View, type ViewStyle} from 'react-native'
import {type AppBskyGraphDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModalControls} from '#/state/modals'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListMembersQuery} from '#/state/queries/list-members'
import {useSession} from '#/state/session'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List, type ListRef} from '#/view/com/util/List'
import {ProfileCardFeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {LoadMoreRetryBtn} from '#/view/com/util/LoadMoreRetryBtn'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {ListFooter} from '#/components/Lists'
import * as ProfileCard from '#/components/ProfileCard'
import type * as bsky from '#/types/bsky'

const LOADING_ITEM = {_reactKey: '__loading__'}
const EMPTY_ITEM = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}
const LOAD_MORE_ERROR_ITEM = {_reactKey: '__load_more_error__'}

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
  renderHeader: () => JSX.Element
  renderEmptyState: () => JSX.Element
  testID?: string
  headerOffset?: number
  desktopFixedHeightOffset?: number
}) {
  const t = useTheme()
  const {_} = useLingui()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const {openModal} = useModalControls()
  const {currentAccount} = useSession()
  const moderationOpts = useModerationOpts()

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

  const items = React.useMemo(() => {
    let items: any[] = []
    if (isFetched) {
      if (isEmpty && isError) {
        items = items.concat([ERROR_ITEM])
      }
      if (isEmpty) {
        items = items.concat([EMPTY_ITEM])
      } else if (data) {
        for (const page of data.pages) {
          items = items.concat(page.items)
        }
      }
      if (!isEmpty && isError) {
        items = items.concat([LOAD_MORE_ERROR_ITEM])
      }
    } else if (isFetching) {
      items = items.concat([LOADING_ITEM])
    }
    return items
  }, [isFetched, isEmpty, isError, data, isFetching])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh lists', {message: err})
    }
    setIsRefreshing(false)
  }, [refetch, setIsRefreshing])

  const onEndReached = React.useCallback(async () => {
    if (isFetching || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more lists', {message: err})
    }
  }, [isFetching, hasNextPage, isError, fetchNextPage])

  const onPressRetryLoadMore = React.useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  const onPressEditMembership = React.useCallback(
    (profile: bsky.profile.AnyProfileView) => {
      openModal({
        name: 'user-add-remove-lists',
        subject: profile.did,
        displayName: profile.displayName || profile.handle,
        handle: profile.handle,
      })
    },
    [openModal],
  )

  // rendering
  // =

  const renderItem = React.useCallback(
    ({item}: {item: any}) => {
      if (item === EMPTY_ITEM) {
        return renderEmptyState()
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={cleanError(error)}
            onPressTryAgain={onPressTryAgain}
          />
        )
      } else if (item === LOAD_MORE_ERROR_ITEM) {
        return (
          <LoadMoreRetryBtn
            label={_(
              msg`There was an issue fetching the list. Tap here to try again.`,
            )}
            onPress={onPressRetryLoadMore}
          />
        )
      } else if (item === LOADING_ITEM) {
        return <ProfileCardFeedLoadingPlaceholder />
      }

      const profile = (item as AppBskyGraphDefs.ListItemView).subject
      if (!moderationOpts) return null

      return (
        <View
          style={[a.py_md, a.px_xl, a.border_t, t.atoms.border_contrast_low]}>
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
                    label={_(msg({message: 'Edit', context: 'action'}))}
                    onPress={() => onPressEditMembership(profile)}
                    size="small"
                    variant="solid"
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
    },
    [
      renderEmptyState,
      error,
      onPressTryAgain,
      onPressRetryLoadMore,
      moderationOpts,
      isOwner,
      onPressEditMembership,
      _,
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
        keyExtractor={(item: any) => item.subject?.did || item._reactKey}
        renderItem={renderItem}
        ListHeaderComponent={!isEmpty ? renderHeader : undefined}
        ListFooterComponent={renderFooter}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        headerOffset={headerOffset}
        contentContainerStyle={{
          minHeight: Dimensions.get('window').height * 1.5,
        }}
        onScrolledDownChange={onScrolledDownChange}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        removeClippedSubviews={true}
        desktopFixedHeight={desktopFixedHeightOffset || true}
      />
    </View>
  )
}

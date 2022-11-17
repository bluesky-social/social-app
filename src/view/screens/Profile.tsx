import React, {useEffect, useState, useMemo} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ViewSelector} from '../com/util/ViewSelector'
import {FAB} from '../com/util/FloatingActionButton'
import {ScreenParams} from '../routes'
import {ProfileUiModel, Sections} from '../../state/models/profile-ui'
import {MembershipItem} from '../../state/models/memberships-view'
import {useStores} from '../../state'
import {ConfirmModel} from '../../state/models/shell-ui'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {FeedItem} from '../com/posts/FeedItem'
import {ProfileCard} from '../com/profile/ProfileCard'
import {PostFeedLoadingPlaceholder} from '../com/util/LoadingPlaceholder'
import {ErrorScreen} from '../com/util/ErrorScreen'
import {ErrorMessage} from '../com/util/ErrorMessage'
import {EmptyState} from '../com/util/EmptyState'
import Toast from '../com/util/Toast'
import {s, colors} from '../lib/styles'

const LOADING_ITEM = {_reactKey: '__loading__'}
const END_ITEM = {_reactKey: '__end__'}
const EMPTY_ITEM = {_reactKey: '__empty__'}

export const Profile = observer(({navIdx, visible, params}: ScreenParams) => {
  const store = useStores()
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const uiState = useMemo(
    () => new ProfileUiModel(store, {user: params.name}),
    [params.user],
  )

  useEffect(() => {
    let aborted = false
    if (!visible) {
      return
    }
    if (hasSetup) {
      console.log('Updating profile for', params.name)
      uiState.update()
    } else {
      console.log('Fetching profile for', params.name)
      store.nav.setTitle(navIdx, params.name)
      uiState.setup().then(() => {
        if (aborted) return
        setHasSetup(true)
      })
    }
    return () => {
      aborted = true
    }
  }, [visible, params.name, store])

  // events
  // =

  const onSelectView = (index: number) => {
    uiState.setSelectedViewIndex(index)
  }
  const onRefresh = () => {
    uiState
      .refresh()
      .catch((err: any) => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    uiState
      .loadMore()
      .catch((err: any) => console.error('Failed to load more', err))
  }
  const onPressTryAgain = () => {
    uiState.setup()
  }
  const onPressRemoveMember = (membership: MembershipItem) => {
    store.shell.openModal(
      new ConfirmModel(
        `Remove ${membership.displayName || membership.handle}?`,
        `You'll be able to invite them again if you change your mind.`,
        async () => {
          await uiState.members.removeMember(membership.did)
          Toast.show(`User removed`, {
            duration: Toast.durations.LONG,
            position: Toast.positions.TOP,
          })
        },
      ),
    )
  }
  const onComposePress = () => {
    store.shell.openComposer({})
  }

  // rendering
  // =

  const isSceneCreator =
    uiState.isScene && store.me.did === uiState.profile.creator

  const renderHeader = () => {
    if (!uiState) {
      return <View />
    }
    return <ProfileHeader view={uiState.profile} onRefreshAll={onRefresh} />
  }
  let renderItem
  let items: any[] = []
  if (uiState) {
    if (uiState.isInitialLoading) {
      items.push(LOADING_ITEM)
      renderItem = () => <PostFeedLoadingPlaceholder />
    } else if (uiState.currentView.hasError) {
      items.push({
        _reactKey: '__error__',
        error: uiState.currentView.error,
      })
      renderItem = (item: any) => (
        <View style={s.p5}>
          <ErrorMessage
            dark
            message={item.error}
            onPressTryAgain={onPressTryAgain}
          />
        </View>
      )
    } else {
      if (
        uiState.selectedView === Sections.Posts ||
        uiState.selectedView === Sections.Trending
      ) {
        if (uiState.feed.hasContent) {
          items = uiState.feed.feed.slice()
          if (!uiState.feed.hasMore) {
            items.push(END_ITEM)
          }
          renderItem = (item: any) => {
            if (item === END_ITEM) {
              return <Text style={styles.endItem}>- end of feed -</Text>
            }
            return <FeedItem item={item} />
          }
        } else if (uiState.feed.isEmpty) {
          items.push(EMPTY_ITEM)
          if (uiState.profile.isScene) {
            renderItem = () => (
              <EmptyState
                icon="user-group"
                message="As members upvote posts, they will trend here. Follow the scene to see its trending posts in your timeline."
              />
            )
          } else {
            renderItem = () => <Text style={styles.loading}>No posts yet!</Text>
          }
        }
      } else if (uiState.selectedView === Sections.Scenes) {
        if (uiState.memberships.hasContent) {
          items = uiState.memberships.memberships.slice()
          renderItem = (item: any) => {
            return (
              <ProfileCard
                did={item.did}
                handle={item.handle}
                displayName={item.displayName}
              />
            )
          }
        } else if (uiState.memberships.isEmpty) {
          items.push(EMPTY_ITEM)
          renderItem = () => (
            <EmptyState
              icon="user-group"
              message="This user hasn't joined any scenes."
            />
          )
        }
      } else if (uiState.selectedView === Sections.Members) {
        if (uiState.members.hasContent) {
          items = uiState.members.members.slice()
          renderItem = (item: any) => {
            const shouldAdmin = isSceneCreator && item.did !== store.me.did
            const renderButton = shouldAdmin
              ? () => (
                  <>
                    <FontAwesomeIcon
                      icon="user-xmark"
                      style={[s.mr5]}
                      size={14}
                    />
                    <Text style={[s.fw400, s.f14]}>Remove</Text>
                  </>
                )
              : undefined
            return (
              <ProfileCard
                did={item.did}
                handle={item.handle}
                displayName={item.displayName}
                renderButton={renderButton}
                onPressButton={() => onPressRemoveMember(item)}
              />
            )
          }
        } else if (uiState.members.isEmpty) {
          items.push(EMPTY_ITEM)
          renderItem = () => (
            <EmptyState
              icon="user-group"
              message="This scene doesn't have any members."
            />
          )
        }
      } else {
        items.push(EMPTY_ITEM)
        renderItem = () => <Text>TODO</Text>
      }
    }
  }
  if (!renderItem) {
    renderItem = () => <View />
  }

  return (
    <View style={styles.container}>
      {uiState.profile.hasError ? (
        <ErrorScreen
          title="Failed to load profile"
          message={`There was an issue when attempting to load ${params.name}`}
          details={uiState.profile.error}
          onPressTryAgain={onPressTryAgain}
        />
      ) : uiState.profile.hasLoaded ? (
        <ViewSelector
          sections={uiState.selectorItems}
          items={items}
          renderHeader={renderHeader}
          renderItem={renderItem}
          refreshing={uiState.isRefreshing || false}
          onSelectView={onSelectView}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      ) : (
        renderHeader()
      )}
      <FAB icon="pen-nib" onPress={onComposePress} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
  },
  loading: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  endItem: {
    paddingTop: 20,
    paddingBottom: 30,
    color: colors.gray5,
    textAlign: 'center',
  },
})

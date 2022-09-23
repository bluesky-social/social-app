import React, {useEffect, useState} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {ViewSelector} from '../com/util/ViewSelector'
import {ScreenParams} from '../routes'
import {ProfileUiModel, SECTION_IDS} from '../../state/models/profile-ui'
import {useStores} from '../../state'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {FeedItem} from '../com/posts/FeedItem'
import {ErrorScreen} from '../com/util/ErrorScreen'
import {ErrorMessage} from '../com/util/ErrorMessage'
import {s, colors} from '../lib/styles'

const LOADING_ITEM = {_reactKey: '__loading__'}
const END_ITEM = {_reactKey: '__end__'}
const EMPTY_ITEM = {_reactKey: '__empty__'}

export const Profile = observer(({visible, params}: ScreenParams) => {
  const store = useStores()
  const [hasSetup, setHasSetup] = useState<boolean>(false)
  const [profileUiState, setProfileUiState] = useState<
    ProfileUiModel | undefined
  >()

  useEffect(() => {
    if (!visible) {
      return
    }
    const user = params.name
    if (hasSetup) {
      console.log('Updating profile for', user)
      profileUiState?.update()
    } else {
      console.log('Fetching profile for', user)
      store.nav.setTitle(user)
      const newProfileUiState = new ProfileUiModel(store, {user})
      setProfileUiState(newProfileUiState)
      newProfileUiState.setup().then(() => {
        setHasSetup(true)
      })
    }
  }, [visible, params.name, store])

  // events
  // =

  const onSelectView = (index: number) => {
    profileUiState?.setSelectedViewIndex(index)
  }
  const onRefresh = () => {
    profileUiState
      ?.refresh()
      .catch((err: any) => console.error('Failed to refresh', err))
  }
  const onEndReached = () => {
    profileUiState
      ?.loadMore()
      .catch((err: any) => console.error('Failed to load more', err))
  }
  const onPressTryAgain = () => {
    profileUiState?.setup()
  }

  // rendering
  // =

  const renderHeader = () => {
    if (!profileUiState) {
      return <View />
    }
    return <ProfileHeader view={profileUiState.profile} />
  }
  let renderItem
  let items: any[] = []
  if (profileUiState) {
    if (profileUiState.selectedViewIndex === SECTION_IDS.POSTS) {
      if (profileUiState.isInitialLoading) {
        items.push(LOADING_ITEM)
        renderItem = () => <Text style={styles.loading}>Loading...</Text>
      } else if (profileUiState.feed.hasError) {
        items.push({
          _reactKey: '__error__',
          error: profileUiState.feed.errorStr,
        })
        renderItem = (item: any) => (
          <View style={s.p5}>
            <ErrorMessage
              message={item.error}
              onPressTryAgain={onPressTryAgain}
            />
          </View>
        )
      } else if (profileUiState.currentView.hasContent) {
        items = profileUiState.feed.feed.slice()
        if (profileUiState.feed.hasReachedEnd) {
          items.push(END_ITEM)
        }
        renderItem = (item: any) => {
          if (item === END_ITEM) {
            return <Text style={styles.endItem}>- end of feed -</Text>
          }
          return <FeedItem item={item} />
        }
      } else if (profileUiState.currentView.isEmpty) {
        items.push(EMPTY_ITEM)
        renderItem = () => <Text style={styles.loading}>No posts yet!</Text>
      }
    }
    if (profileUiState.selectedViewIndex === SECTION_IDS.BADGES) {
      items.push(EMPTY_ITEM)
      renderItem = () => <Text>TODO</Text>
    }
  }
  if (!renderItem) {
    renderItem = () => <View />
  }

  return (
    <View style={styles.container}>
      {profileUiState?.profile.hasError ? (
        <ErrorScreen
          title="Failed to load profile"
          message={`There was an issue when attempting to load ${params.name}`}
          details={profileUiState.profile.error}
          onPressTryAgain={onPressTryAgain}
        />
      ) : (
        <ViewSelector
          sections={ProfileUiModel.SELECTOR_ITEMS}
          items={items}
          renderHeader={renderHeader}
          renderItem={renderItem}
          refreshing={profileUiState?.isRefreshing || false}
          onSelectView={onSelectView}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
        />
      )}
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

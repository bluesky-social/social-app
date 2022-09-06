import React, {useState, useEffect} from 'react'
import {SectionList, StyleSheet, Text, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {ProfileUiModel, SECTION_IDS} from '../../state/models/profile-ui'
import {FeedViewItemModel} from '../../state/models/feed-view'
import {useStores} from '../../state'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {FeedItem} from '../com/posts/FeedItem'
import {Selector} from '../com/util/Selector'
import {ErrorScreen} from '../com/util/ErrorScreen'
import {ErrorMessage} from '../com/util/ErrorMessage'
import {s, colors} from '../lib/styles'
import {ScreenParams} from '../routes'

const SECTION_HEADER_ITEM = Symbol('SectionHeaderItem')
const LOADING_ITEM = Symbol('LoadingItem')
const EMPTY_ITEM = Symbol('EmptyItem')
const END_ITEM = Symbol('EndItem')

interface RenderItemParams {
  item: any
  index: number
  section: Section
}

interface ErrorItem {
  error: string
}

interface Section {
  data: any[]
  keyExtractor?: (v: any) => string
  renderItem: (params: RenderItemParams) => JSX.Element
}

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

  const onSelectViewSelector = (index: number) =>
    profileUiState?.setSelectedViewIndex(index)
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

  const renderItem = (_params: RenderItemParams) => <View />
  const renderLoadingItem = (_params: RenderItemParams) => (
    <Text style={styles.loading}>Loading...</Text>
  )
  const renderErrorItem = ({item}: {item: ErrorItem}) => (
    <View style={s.p5}>
      <ErrorMessage message={item.error} onPressTryAgain={onPressTryAgain} />
    </View>
  )
  const renderEmptyItem = (_params: RenderItemParams) => (
    <Text style={styles.loading}>No posts yet!</Text>
  )
  const renderProfileItem = (_params: RenderItemParams) => {
    if (!profileUiState) {
      return <View />
    }
    return <ProfileHeader view={profileUiState.profile} />
  }
  const renderSectionHeader = ({section}: {section: Section}) => {
    if (section?.data?.[0] !== SECTION_HEADER_ITEM) {
      return (
        <Selector
          items={ProfileUiModel.SELECTOR_ITEMS}
          style={styles.selector}
          onSelect={onSelectViewSelector}
        />
      )
    }
    return <View />
  }
  const renderPostsItem = ({item}: {item: FeedViewItemModel | Symbol}) => {
    if (item === END_ITEM || item instanceof Symbol) {
      return <Text style={styles.endItem}>- end of feed -</Text>
    }
    return <FeedItem item={item} />
  }
  const renderBadgesItem = ({item}: {item: any}) => <Text>todo</Text>

  const sections = [
    {data: [SECTION_HEADER_ITEM], renderItem: renderProfileItem},
  ]
  if (profileUiState) {
    if (profileUiState.selectedViewIndex === SECTION_IDS.POSTS) {
      if (profileUiState.isInitialLoading) {
        sections.push({
          data: [LOADING_ITEM],
          renderItem: renderLoadingItem,
        } as Section)
      } else if (profileUiState.feed.hasError) {
        sections.push({
          data: [{error: profileUiState.feed.error}],
          renderItem: renderErrorItem,
        } as Section)
      } else if (profileUiState.currentView.hasContent) {
        const items: (FeedViewItemModel | Symbol)[] =
          profileUiState.feed.feed.slice()
        if (profileUiState.feed.hasReachedEnd) {
          items.push(END_ITEM)
        }
        sections.push({
          data: items,
          renderItem: renderPostsItem,
          keyExtractor: (item: FeedViewItemModel) => item._reactKey,
        } as Section)
      } else if (profileUiState.currentView.isEmpty) {
        sections.push({
          data: [EMPTY_ITEM],
          renderItem: renderEmptyItem,
        })
      }
    }
    if (profileUiState.selectedViewIndex === SECTION_IDS.BADGES) {
      sections.push({
        data: [{}],
        renderItem: renderBadgesItem,
      } as Section)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.feed}>
        {profileUiState &&
          (profileUiState.profile.hasError ? (
            <ErrorScreen
              title="Failed to load profile"
              message={`There was an issue when attempting to load ${params.name}`}
              details={profileUiState.profile.error}
              onPressTryAgain={onPressTryAgain}
            />
          ) : (
            <SectionList
              sections={sections}
              renderSectionHeader={renderSectionHeader}
              renderItem={renderItem}
              refreshing={profileUiState.isRefreshing}
              onRefresh={onRefresh}
              onEndReached={onEndReached}
            />
          ))}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
  },
  selector: {
    paddingTop: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderColor: colors.gray2,
  },
  feed: {
    flex: 1,
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

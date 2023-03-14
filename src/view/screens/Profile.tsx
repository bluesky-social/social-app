import React, {useEffect, useState} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ViewSelector} from '../com/util/ViewSelector'
import {CenteredView} from '../com/util/Views'
import {ProfileUiModel, Sections} from 'state/models/profile-ui'
import {useStores} from 'state/index'
import {ProfileHeader} from '../com/profile/ProfileHeader'
import {FeedItem} from '../com/posts/FeedItem'
import {PostFeedLoadingPlaceholder} from '../com/util/LoadingPlaceholder'
import {ErrorScreen} from '../com/util/error/ErrorScreen'
import {ErrorMessage} from '../com/util/error/ErrorMessage'
import {EmptyState} from '../com/util/EmptyState'
import {Text} from '../com/util/text/Text'
import {FAB} from '../com/util/FAB'
import {s, colors} from 'lib/styles'
import {useOnMainScroll} from 'lib/hooks/useOnMainScroll'
import {useAnalytics} from 'lib/analytics'
import {ComposeIcon2} from 'lib/icons'

const LOADING_ITEM = {_reactKey: '__loading__'}
const END_ITEM = {_reactKey: '__end__'}
const EMPTY_ITEM = {_reactKey: '__empty__'}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>
export const ProfileScreen = withAuthRequired(
  observer(({route}: Props) => {
    const store = useStores()
    const {screen, track} = useAnalytics()

    useEffect(() => {
      screen('Profile')
    }, [screen])

    const onMainScroll = useOnMainScroll(store)
    const [hasSetup, setHasSetup] = useState<boolean>(false)
    const uiState = React.useMemo(
      () => new ProfileUiModel(store, {user: route.params.name}),
      [route.params.name, store],
    )

    useFocusEffect(
      React.useCallback(() => {
        let aborted = false
        const feedCleanup = uiState.feed.registerListeners()
        if (hasSetup) {
          uiState.update()
        } else {
          uiState.setup().then(() => {
            if (aborted) {
              return
            }
            setHasSetup(true)
          })
        }
        return () => {
          aborted = true
          feedCleanup()
        }
      }, [hasSetup, uiState]),
    )

    // events
    // =

    const onPressCompose = React.useCallback(() => {
      track('ProfileScreen:PressCompose')
      store.shell.openComposer({})
    }, [store, track])
    const onSelectView = (index: number) => {
      uiState.setSelectedViewIndex(index)
    }
    const onRefresh = () => {
      uiState
        .refresh()
        .catch((err: any) =>
          store.log.error('Failed to refresh user profile', err),
        )
    }
    const onEndReached = () => {
      uiState
        .loadMore()
        .catch((err: any) =>
          store.log.error('Failed to load more entries in user profile', err),
        )
    }
    const onPressTryAgain = () => {
      uiState.setup()
    }

    // rendering
    // =

    const renderHeader = () => {
      if (!uiState) {
        return <View />
      }
      return <ProfileHeader view={uiState.profile} onRefreshAll={onRefresh} />
    }
    let renderItem
    let Footer
    let items: any[] = []
    if (uiState) {
      if (uiState.isInitialLoading) {
        items = items.concat([LOADING_ITEM])
        renderItem = () => <PostFeedLoadingPlaceholder />
      } else if (uiState.currentView.hasError) {
        items = items.concat([
          {
            _reactKey: '__error__',
            error: uiState.currentView.error,
          },
        ])
        renderItem = (item: any) => (
          <View style={s.p5}>
            <ErrorMessage
              message={item.error}
              onPressTryAgain={onPressTryAgain}
            />
          </View>
        )
      } else {
        if (
          uiState.selectedView === Sections.Posts ||
          uiState.selectedView === Sections.PostsWithReplies
        ) {
          if (uiState.feed.hasContent) {
            if (uiState.selectedView === Sections.Posts) {
              items = uiState.feed.nonReplyFeed
            } else {
              items = uiState.feed.feed.slice()
            }
            if (!uiState.feed.hasMore) {
              items = items.concat([END_ITEM])
            } else if (uiState.feed.isLoading) {
              Footer = LoadingMoreFooter
            }
            renderItem = (item: any) => {
              if (item === END_ITEM) {
                return <Text style={styles.endItem}>- end of feed -</Text>
              }
              return (
                <FeedItem item={item} ignoreMuteFor={uiState.profile.did} />
              )
            }
          } else if (uiState.feed.isEmpty) {
            items = items.concat([EMPTY_ITEM])
            renderItem = () => (
              <EmptyState
                icon={['far', 'message']}
                message="No posts yet!"
                style={styles.emptyState}
              />
            )
          }
        } else {
          items = items.concat([EMPTY_ITEM])
          renderItem = () => <Text>TODO</Text>
        }
      }
    }
    if (!renderItem) {
      renderItem = () => <View />
    }

    return (
      <View testID="profileView" style={styles.container}>
        {uiState.profile.hasError ? (
          <ErrorScreen
            testID="profileErrorScreen"
            title="Failed to load profile"
            message={`There was an issue when attempting to load ${route.params.name}`}
            details={uiState.profile.error}
            onPressTryAgain={onPressTryAgain}
          />
        ) : uiState.profile.hasLoaded ? (
          <ViewSelector
            swipeEnabled
            sections={uiState.selectorItems}
            items={items}
            renderHeader={renderHeader}
            renderItem={renderItem}
            ListFooterComponent={Footer}
            refreshing={uiState.isRefreshing || false}
            onSelectView={onSelectView}
            onScroll={onMainScroll}
            onRefresh={onRefresh}
            onEndReached={onEndReached}
          />
        ) : (
          <CenteredView>{renderHeader()}</CenteredView>
        )}
        <FAB
          testID="composeFAB"
          onPress={onPressCompose}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
        />
      </View>
    )
  }),
)

function LoadingMoreFooter() {
  return (
    <View style={styles.loadingMoreFooter}>
      <ActivityIndicator />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    height: '100%',
  },
  loading: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  emptyState: {
    paddingVertical: 40,
  },
  loadingMoreFooter: {
    paddingVertical: 20,
  },
  endItem: {
    paddingTop: 20,
    paddingBottom: 30,
    color: colors.gray5,
    textAlign: 'center',
  },
})

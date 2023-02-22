import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {CenteredView, FlatList} from '../util/Views'
import {observer} from 'mobx-react-lite'
import {ErrorScreen} from '../util/error/ErrorScreen'
import {ProfileCardWithFollowBtn} from '../profile/ProfileCard'
import {useStores} from 'state/index'
import {
  SuggestedActorsViewModel,
  SuggestedActor,
} from 'state/models/suggested-actors-view'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'

export const SuggestedFollows = observer(
  ({onNoSuggestions}: {onNoSuggestions?: () => void}) => {
    const pal = usePalette('default')
    const store = useStores()

    const view = React.useMemo<SuggestedActorsViewModel>(
      () => new SuggestedActorsViewModel(store),
      [store],
    )

    React.useEffect(() => {
      view
        .loadMore()
        .catch((err: any) =>
          store.log.error('Failed to fetch suggestions', err),
        )
    }, [view, store.log])

    React.useEffect(() => {
      if (!view.isLoading && !view.hasError && !view.hasContent) {
        onNoSuggestions?.()
      }
    }, [view, view.isLoading, view.hasError, view.hasContent, onNoSuggestions])

    const onRefresh = () => {
      view
        .refresh()
        .catch((err: any) =>
          store.log.error('Failed to fetch suggestions', err),
        )
    }
    const onEndReached = () => {
      view
        .loadMore()
        .catch(err =>
          view?.rootStore.log.error('Failed to load more suggestions', err),
        )
    }

    const renderItem = ({item}: {item: SuggestedActor}) => {
      return (
        <ProfileCardWithFollowBtn
          key={item.did}
          did={item.did}
          declarationCid={item.declaration.cid}
          handle={item.handle}
          displayName={item.displayName}
          avatar={item.avatar}
          description={item.description}
        />
      )
    }
    return (
      <View style={styles.container}>
        {view.hasError ? (
          <CenteredView>
            <ErrorScreen
              title="Failed to load suggestions"
              message="There was an error while trying to load suggested follows."
              details={view.error}
              onPressTryAgain={onRefresh}
            />
          </CenteredView>
        ) : view.isEmpty ? (
          <View />
        ) : (
          <View style={[styles.suggestionsContainer, pal.view]}>
            <FlatList
              data={view.suggestions}
              keyExtractor={item => item.did}
              refreshing={view.isRefreshing}
              onRefresh={onRefresh}
              onEndReached={onEndReached}
              renderItem={renderItem}
              initialNumToRender={15}
              ListFooterComponent={() => (
                <View style={styles.footer}>
                  {view.isLoading && <ActivityIndicator />}
                </View>
              )}
              contentContainerStyle={s.contentContainer}
            />
          </View>
        )}
      </View>
    )
  },
)

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },

  suggestionsContainer: {
    height: '100%',
  },
  footer: {
    height: 200,
    paddingTop: 20,
  },
})

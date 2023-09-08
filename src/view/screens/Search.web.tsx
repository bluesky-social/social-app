import React from 'react'
import {View, StyleSheet} from 'react-native'
import {SearchUIModel} from 'state/models/ui/search'
import {FoafsModel} from 'state/models/discovery/foafs'
import {SuggestedActorsModel} from 'state/models/discovery/suggested-actors'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Suggestions} from 'view/com/search/Suggestions'
import {SearchResults} from 'view/com/search/SearchResults'
import {observer} from 'mobx-react-lite'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {useStores} from 'state/index'
import {CenteredView} from 'view/com/util/Views'
import * as Mobile from './SearchMobile'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

type Props = NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>
export const SearchScreen = withAuthRequired(
  observer(function SearchScreenImpl({navigation, route}: Props) {
    const store = useStores()
    const params = route.params || {}
    const foafs = React.useMemo<FoafsModel>(
      () => new FoafsModel(store),
      [store],
    )
    const suggestedActors = React.useMemo<SuggestedActorsModel>(
      () => new SuggestedActorsModel(store),
      [store],
    )
    const searchUIModel = React.useMemo<SearchUIModel | undefined>(
      () => (params.q ? new SearchUIModel(store) : undefined),
      [params.q, store],
    )

    React.useEffect(() => {
      if (params.q && searchUIModel) {
        searchUIModel.fetch(params.q)
      }
      if (!foafs.hasData) {
        foafs.fetch()
      }
      if (!suggestedActors.hasLoaded) {
        suggestedActors.loadMore(true)
      }
    }, [foafs, suggestedActors, searchUIModel, params.q])

    const {isDesktop} = useWebMediaQueries()

    if (searchUIModel) {
      return (
        <View style={styles.scrollContainer}>
          <SearchResults model={searchUIModel} />
        </View>
      )
    }

    if (!isDesktop) {
      return (
        <CenteredView style={styles.scrollContainer}>
          <Mobile.SearchScreen navigation={navigation} route={route} />
        </CenteredView>
      )
    }

    return <Suggestions foafs={foafs} suggestedActors={suggestedActors} />
  }),
)

const styles = StyleSheet.create({
  scrollContainer: {
    height: '100%',
    overflowY: 'auto',
  },
})

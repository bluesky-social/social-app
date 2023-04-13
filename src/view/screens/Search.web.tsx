import React from 'react'
import {StyleSheet, View} from 'react-native'
import {SearchUIModel} from 'state/models/ui/search'
import {FoafsModel} from 'state/models/discovery/foafs'
import {SuggestedActorsModel} from 'state/models/discovery/suggested-actors'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ScrollView} from 'view/com/util/Views'
import {Suggestions} from 'view/com/search/Suggestions'
import {SearchResults} from 'view/com/search/SearchResults'
import {observer} from 'mobx-react-lite'
import {
  NativeStackScreenProps,
  SearchTabNavigatorParams,
} from 'lib/routes/types'
import {useStores} from 'state/index'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import * as Mobile from './SearchMobile'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'

type Props = NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>
export const SearchScreen = withAuthRequired(
  observer(({navigation, route}: Props) => {
    const pal = usePalette('default')
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

    if (searchUIModel) {
      return <SearchResults model={searchUIModel} />
    }

    const {isDesktop} = useWebMediaQueries()

    if (!isDesktop) {
      return <Mobile.SearchScreen navigation={navigation} route={route} />
    }

    return (
      <ScrollView
        testID="searchScrollView"
        style={[pal.view, styles.container]}
        scrollEventThrottle={100}>
        <Suggestions foafs={foafs} suggestedActors={suggestedActors} />
        <View style={s.footerSpacer} />
      </ScrollView>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    marginBottom: 14,
  },
  headerMenuBtn: {
    width: 40,
    height: 30,
    marginLeft: 6,
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerSearchIcon: {
    marginRight: 6,
    alignSelf: 'center',
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 17,
  },
  headerCancelBtn: {
    width: 60,
    paddingLeft: 10,
  },

  searchPrompt: {
    textAlign: 'center',
    paddingTop: 10,
  },
})

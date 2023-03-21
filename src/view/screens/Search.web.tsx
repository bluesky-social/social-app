import React from 'react'
import {StyleSheet, View} from 'react-native'
import {SearchUIModel} from 'state/models/ui/search'
import {FoafsModel} from 'state/models/discovery/foafs'
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

type Props = NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>
export const SearchScreen = withAuthRequired(
  observer(({route}: Props) => {
    const pal = usePalette('default')
    const store = useStores()
    const foafs = React.useMemo<FoafsModel>(
      () => new FoafsModel(store),
      [store],
    )
    const searchUIModel = React.useMemo<SearchUIModel | undefined>(
      () => (route.params.q ? new SearchUIModel(store) : undefined),
      [route.params.q, store],
    )

    React.useEffect(() => {
      if (route.params.q && searchUIModel) {
        searchUIModel.fetch(route.params.q)
      }
      if (!foafs.hasData) {
        foafs.fetch()
      }
    }, [foafs, searchUIModel, route.params.q])

    if (searchUIModel) {
      return <SearchResults model={searchUIModel} />
    }

    return (
      <ScrollView
        testID="searchScrollView"
        style={[pal.view, styles.container]}
        scrollEventThrottle={100}>
        <Suggestions foafs={foafs} />
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

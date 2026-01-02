import {
  type NativeStackScreenProps,
  type SearchTabNavigatorParams,
} from '#/lib/routes/types'
import {SearchScreenShell} from './Shell'

export function SearchScreen(
  props: NativeStackScreenProps<SearchTabNavigatorParams, 'Search'>,
) {
  const queryParam = props.route?.params?.q ?? ''

  return (
    <SearchScreenShell
      queryParam={queryParam}
      testID="searchScreen"
      isExplore
    />
  )
}

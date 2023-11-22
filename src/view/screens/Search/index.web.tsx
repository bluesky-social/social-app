import {withAuthRequired} from '#/view/com/auth/withAuthRequired'
import {SearchScreenDesktop} from '#/view/screens/Search/Search'

export const SearchScreen = withAuthRequired(SearchScreenDesktop, {
  isPublic: true,
})

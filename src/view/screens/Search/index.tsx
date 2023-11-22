import {withAuthRequired} from '#/view/com/auth/withAuthRequired'
import {SearchScreenMobile} from '#/view/screens/Search/Search'

export const SearchScreen = withAuthRequired(SearchScreenMobile, {
  isPublic: true,
})

import {useSuggestedUsers} from '#/screens/Search/util/useSuggestedUsers'
import {AccountsList} from './AccountsList'

interface Props {
  interests: string[]
  selectedInterests: string[]
  useFullExperience: boolean
}

export function SuggestedAccounts({
  interests,
  selectedInterests,
  useFullExperience,
}: Props) {
  const queryResult = useSuggestedUsers({
    category: useFullExperience ? null : interests[0],
    search: !useFullExperience,
    overrideInterests: selectedInterests,
  })

  return <AccountsList queryResult={queryResult} source="SuggestedUsers" />
}

import {useSuggestedOnboardingUsers} from '#/screens/Search/util/useSuggestedOnboardingUsers'
import {AccountsList} from './AccountsList'

interface Props {
  interests: string[]
  selectedInterests: string[]
  useFullExperience: boolean
}

export function OnboardingAccounts({
  interests,
  selectedInterests,
  useFullExperience,
}: Props) {
  const queryResult = useSuggestedOnboardingUsers({
    category: useFullExperience ? null : interests[0],
    search: !useFullExperience,
    overrideInterests: selectedInterests,
  })

  return (
    <AccountsList queryResult={queryResult} source="SuggestedOnboardingUsers" />
  )
}

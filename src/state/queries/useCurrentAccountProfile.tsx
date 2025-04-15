import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'

export function useCurrentAccountProfile() {
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  return profile
}

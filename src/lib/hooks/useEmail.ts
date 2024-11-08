import {useSession} from '#/state/session'
import {BSKY_SERVICE} from '../constants'
import {getHostnameFromUrl} from '../strings/url-helpers'

export function useEmail() {
  const {currentAccount} = useSession()
  const isSelfHost =
    currentAccount &&
    getHostnameFromUrl(currentAccount.service) !==
      getHostnameFromUrl(BSKY_SERVICE)
  const needsEmailVerification = !isSelfHost && !currentAccount?.emailConfirmed

  return {needsEmailVerification}
}

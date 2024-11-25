import Purchases, {PURCHASES_ERROR_CODE} from 'react-native-purchases'
import {useQuery} from '@tanstack/react-query'

import {NativePurchaseRestricted} from '#/state/purchases/types'
import {useSession} from '#/state/session'

export function useNativeUserState() {
  const {currentAccount} = useSession()

  const {data, isFetching} = useQuery<{
    restricted: NativePurchaseRestricted
  }>({
    queryKey: ['purchases-native-user-state', currentAccount?.did],
    placeholderData: {restricted: 'unknown'},
    /**
     * Once we fetch this, no need to do so again for the current session. We
     * don't do any transfer logic between accounts, so this doesn't change
     * during the course of a user session.
     */
    staleTime: Infinity,
    async queryFn() {
      if (!currentAccount) {
        return {restricted: 'unknown'}
      }

      try {
        // MUST ensure we're the correct user first
        await Purchases.logIn(currentAccount.did)
        await Purchases.restorePurchases()
        return {restricted: 'no'}
      } catch (e: any) {
        switch (e.code) {
          /**
           * Indicates there are active subscriptions for another account on
           * this device. User cannot make additional purchases on this device.
           *
           * @see https://www.revenuecat.com/docs/test-and-launch/errors#-receipt_already_in_use
           */
          case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
            return {restricted: 'yes'}
          default:
            /**
             * Any other error is considered unknown. Let the user proceed.
             * Additional errors can occur at time of purchase and should be
             * handled there.
             */
            return {restricted: 'no'}
        }
      }
    },
  })

  return {
    loading: isFetching,
    restricted: data?.restricted ?? 'unknown',
  }
}

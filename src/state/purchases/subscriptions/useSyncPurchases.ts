import {useMutation} from '@tanstack/react-query'
import Purchases, { PURCHASES_ERROR_CODE } from 'react-native-purchases'

import {useSession} from '#/state/session'

export function useSyncPurchases() {
  const {currentAccount} = useSession()
  return useMutation({
    async mutationFn() {
      if (!currentAccount) {
        throw new Error('Not logged in')
      }

      try {
        await Purchases.logIn(currentAccount.did)
        return await Purchases.restorePurchases()
      } catch (e: any) {
        if (e.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR) {
          console.log('recipt error', e)
        }
        throw e
      }
    },
  })
}

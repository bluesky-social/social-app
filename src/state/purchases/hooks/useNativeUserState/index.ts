import React from 'react'
import Purchases, {PURCHASES_ERROR_CODE} from 'react-native-purchases'

import {NativePurchaseRestricted} from '#/state/purchases/context'
import {useSession} from '#/state/session'

export function useNativeUserState() {
  const {currentAccount} = useSession()
  const [restricted, setRestricted] =
    React.useState<NativePurchaseRestricted>('unknown')

  React.useEffect(() => {
    async function check() {
      if (!currentAccount?.did) return

      try {
        // MUST ensure we're the correct user first
        await Purchases.logIn(currentAccount?.did)
        await Purchases.restorePurchases()
        setRestricted('no')
      } catch (e: any) {
        /**
         * @see https://www.revenuecat.com/docs/test-and-launch/errors#-receipt_already_in_use
         */
        if (e.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR) {
          setRestricted('yes')
        }
      }
    }

    check()
  }, [currentAccount?.did])

  return {
    restricted,
  }
}

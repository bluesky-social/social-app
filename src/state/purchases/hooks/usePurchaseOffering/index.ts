import Purchases, {PURCHASES_ERROR_CODE} from 'react-native-purchases'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {
  PlatformId,
  ReceiptAlreadyInUseError,
  SubscriptionOffering,
} from '#/state/purchases/types'

type Params = {
  did: string
  email: string
  offering: SubscriptionOffering
}

export function usePurchaseOffering() {
  const {_} = useLingui()

  return useMutation<void, Error | ReceiptAlreadyInUseError, Params>({
    async mutationFn({did, email, offering}: Params) {
      if (offering.platform === PlatformId.Web) {
        throw new Error('Unsupported platform')
      }

      try {
        await Purchases.logIn(did)
        await Purchases.setEmail(email)
        await Purchases.purchaseStoreProduct(offering.package)
      } catch (e: any) {
        /**
         * @see https://www.revenuecat.com/docs/test-and-launch/errors#-receipt_already_in_use
         */
        if (e.code === PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR) {
          throw new ReceiptAlreadyInUseError(
            _(
              msg`This device has existing active subscriptions for a different account. Multiple account subscriptions are not possible on native platforms at this time.`,
            ),
            // @ts-ignore
            {cause: e},
          )
        }

        throw e
      }
    },
  })
}

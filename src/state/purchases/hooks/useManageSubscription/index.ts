import {Linking} from 'react-native'
import Purchases from 'react-native-purchases'
import {useMutation} from '@tanstack/react-query'

import {useManageSubscription as useManageWebSubscription} from '#/state/purchases/hooks/useManageSubscription/web'
import {PlatformId} from '#/state/purchases/types'

export function useManageSubscription({platform}: {platform: PlatformId}) {
  const web = useManageWebSubscription({platform})
  return useMutation({
    async mutationFn() {
      if (platform === PlatformId.Web) {
        await web.mutateAsync()
      } else {
        const customer = await Purchases.getCustomerInfo()

        if (customer.managementURL) {
          Linking.openURL(customer.managementURL)
        } else {
          // TODO
        }
      }
    },
  })
}

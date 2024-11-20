import {Linking} from 'react-native'
import {useMutation} from '@tanstack/react-query'
import Purchases from 'react-native-purchases'

export function useManageSubscription() {
  return useMutation({
    async mutationFn() {
      const customer = await Purchases.getCustomerInfo()

      if (customer.managementURL) {
        Linking.openURL(customer.managementURL)
      } else {
        // TODO
      }
    },
  })
}

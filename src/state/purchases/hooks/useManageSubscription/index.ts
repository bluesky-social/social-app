import {Linking} from 'react-native'
import Purchases from 'react-native-purchases'
import {useMutation} from '@tanstack/react-query'

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

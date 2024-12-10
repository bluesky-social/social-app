import React from 'react'
import Purchases, {CustomerInfo} from 'react-native-purchases'

export function useNativeEventsListener({
  onCustomerInfoUpdated,
}: {
  onCustomerInfoUpdated: (info: CustomerInfo) => void
}) {
  React.useEffect(() => {
    Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdated)
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdated)
    }
  }, [onCustomerInfoUpdated])
}

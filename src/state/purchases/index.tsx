import React from 'react'

import {Context, PurchasesState} from '#/state/purchases/context'
import {useNativeEventsListener} from '#/state/purchases/hooks/useNativeEventsListener'
import {useNativeUserState} from '#/state/purchases/hooks/useNativeUserState'
import {usePurchasesState} from '#/state/purchases/hooks/usePurchasesState'

export type {PurchasesState} from '#/state/purchases/context'

export function Provider({children}: {children: React.ReactNode}) {
  const {
    data: purchases,
    error: purchasesStateError,
    refetch,
  } = usePurchasesState()
  const {restricted} = useNativeUserState()
  const ctx = React.useMemo<PurchasesState>(() => {
    if (purchasesStateError) {
      return {
        status: 'error',
        error: purchasesStateError,
      }
    } else if (!purchases) {
      return {
        status: 'loading',
      }
    } else {
      return {
        status: 'ready',
        email: purchases?.email,
        subscriptions: purchases?.subscriptions ?? [],
        entitlements: purchases?.entitlements ?? [],
        config: {
          nativePurchaseRestricted: restricted,
        },
      }
    }
  }, [purchases, purchasesStateError, restricted])

  useNativeEventsListener({
    onCustomerInfoUpdated() {
      refetch()
    },
  })

  return <Context.Provider value={ctx}>{children}</Context.Provider>
}

export function usePurchases() {
  return React.useContext(Context)
}

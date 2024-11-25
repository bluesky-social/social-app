import React from 'react'

import {Context, PurchasesState} from '#/state/purchases/context'
import {useNativeEventsListener} from '#/state/purchases/hooks/useNativeEventsListener'
import {usePurchasesState} from '#/state/purchases/hooks/usePurchasesState'

export type {PurchasesState} from '#/state/purchases/context'

export function Provider({children}: {children: React.ReactNode}) {
  const {
    data: purchases,
    error: purchasesStateError,
    refetch,
  } = usePurchasesState()
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
        config: {},
      }
    }
  }, [purchases, purchasesStateError])

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

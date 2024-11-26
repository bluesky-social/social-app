import React from 'react'

import {
  ApiContext,
  PurchasesApi,
  PurchasesState,
  StateContext,
} from '#/state/purchases/context'
import {useNativeEventsListener} from '#/state/purchases/hooks/useNativeEventsListener'
import {usePurchasesState} from '#/state/purchases/hooks/usePurchasesState'

export type {PurchasesState} from '#/state/purchases/context'

export function Provider({children}: {children: React.ReactNode}) {
  const {
    data: purchases,
    error: purchasesStateError,
    refetch,
    isRefetching,
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
        refetching: isRefetching,
        email: purchases?.email,
        subscriptions: purchases?.subscriptions ?? [],
        entitlements: purchases?.entitlements ?? [],
        config: {},
      }
    }
  }, [purchases, purchasesStateError, isRefetching])

  const apiCtx = React.useMemo<PurchasesApi>(() => {
    return {
      refetch: async () => {
        await refetch()
      },
    }
  }, [refetch])

  useNativeEventsListener({
    onCustomerInfoUpdated() {
      refetch()
    },
  })

  return (
    <ApiContext.Provider value={apiCtx}>
      <StateContext.Provider value={ctx}>{children}</StateContext.Provider>
    </ApiContext.Provider>
  )
}

export function usePurchases() {
  return React.useContext(StateContext)
}

export function usePurchasesApi() {
  return React.useContext(ApiContext)
}

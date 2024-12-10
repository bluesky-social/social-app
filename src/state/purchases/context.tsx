import React from 'react'

import {APIEntitlement, APISubscription} from '#/state/purchases/types'

export type PurchasesState =
  | {
      status: 'loading'
    }
  | {
      status: 'error'
      error: Error
    }
  | {
      status: 'ready'
      refetching: boolean
      email?: string
      subscriptions: APISubscription[]
      entitlements: APIEntitlement[]
      config: {}
    }

export type PurchasesApi = {
  refetch: () => Promise<void>
}

export const StateContext = React.createContext<PurchasesState>({
  status: 'loading',
})

export const ApiContext = React.createContext<PurchasesApi>({
  refetch: async () => {},
})

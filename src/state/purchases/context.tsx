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
      email?: string
      subscriptions: APISubscription[]
      entitlements: APIEntitlement[]
      config: {}
    }

export const Context = React.createContext<PurchasesState>({
  status: 'loading',
})

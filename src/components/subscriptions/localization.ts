import React from 'react'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'

import {TierId} from '#/state/purchases/subscriptions/types'

export function useMainSubscriptionTiersCopy() {
  const {_} = useLingui()

  return {
    [TierId.Main0]: {
      title: _(msg`Bluesky Supporter`),
    },
    [TierId.Main1]: {
      title: _(msg`Bluesky Friend`),
    },
    [TierId.Main2]: {
      title: _(msg`Bluesky Besty`),
    },
  }
}

import {Linking} from 'react-native'
import {useMutation} from '@tanstack/react-query'

import {IS_DEV} from '#/env'
import {useSession} from '#/state/session'
import {api} from '#/state/purchases/subscriptions/api'

export function useManageSubscription() {
  const {currentAccount} = useSession()

  return useMutation({
    async mutationFn() {
      const {data, error} = await api<{
        managementUrl: string
      }>('/account/create-management-url', {
        method: 'POST',
        json: {
          did: currentAccount!.did,
          redirecturl: IS_DEV ? 'http://localhost:19006/subscriptions' : 'https://bsky.app/subscriptions',
        }
      }).json()

      if (error || !data) {
        throw new Error('Failed to fetch subscriptions state')
      }

      Linking.openURL(data.managementUrl)
    },
  })
}

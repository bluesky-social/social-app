/* eslint-disable @typescript-eslint/no-explicit-any */
import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useSessionApi} from '#/state/session'
import {getWebOAuthClient} from '#/state/session/oauth-web-client'

export function AuthCallback() {
  const {login} = useSessionApi()
  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    ;(async () => {
      try {
        const client = getWebOAuthClient()
        const result = await client.init()
        if (result?.session) {
          await login(
            {
              service: '',
              identifier: '',
              password: '',
              oauthSession: result.session,
            },
            'LoginForm',
          )
        }
        navigation.replace('Home')
      } catch (e: any) {
        logger.error('OAuth callback failed', {error: e.message})
        navigation.replace('Home')
      }
    })()
  }, [login, navigation])

  return null
}

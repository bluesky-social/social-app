/* eslint-disable @typescript-eslint/no-explicit-any */
import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {type NavigationProp} from '#/lib/routes/types'
import {logger} from '#/logger'
import {useSessionApi} from '#/state/session'
import {getOAuthClient} from '#/state/session/oauth-client'
import * as Toast from '#/components/Toast'

export function AuthCallback() {
  const {_} = useLingui()
  const {login} = useSessionApi()
  const navigation = useNavigation<NavigationProp>()

  useEffect(() => {
    ;(async () => {
      try {
        const client = getOAuthClient()
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
        Toast.show(_(msg`Sign-in failed. Please try again.`), {type: 'error'})
        navigation.replace('Home')
      }
    })()
  }, [_, login, navigation])

  return null
}

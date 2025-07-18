import {useEffect} from 'react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useSessionApi} from '#/state/session'
import {getWebOAuthClient} from '#/state/session/oauth'

export function AuthCallback() {
  const {loginOauth} = useSessionApi()
  const navigation = useNavigation<NavigationProp>()

  // TODO: handle errors, loading state, etc...
  useEffect(() => {
    const urlStr = window.location.href
    const url = new URL(urlStr)
    const params = new URLSearchParams(url.hash.substring(1))

    ;(async () => {
      const client = getWebOAuthClient()
      const res = await client.callback(params)
      await loginOauth(res.session, 'LoginForm') // TODO: right context?
      navigation.navigate('Home')
    })()
  }, [loginOauth, navigation])

  return null
}

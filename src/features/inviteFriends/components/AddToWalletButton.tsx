import {useEffect, useState} from 'react'
import {Platform, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import * as RNWallet from '@premieroctet/react-native-wallet'

import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import * as Toast from '#/components/Toast'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {type InviteThemeKey} from '../themes'

const BSKY_WEB = 'https://bsky.app'

export function AddToWalletButton({
  themeKey,
  handle,
}: {
  themeKey: InviteThemeKey
  handle: string
}) {
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const agent = useAgent()
  const [canAdd, setCanAdd] = useState<boolean | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (IS_WEB) return
    // Skip the native check if the handle is already known to be unusable.
    if (!handle || handle === 'handle.invalid') return
    let cancelled = false
    ;(RNWallet.canAddPasses() as Promise<boolean>)
      .then((ok: boolean) => {
        if (!cancelled) setCanAdd(ok)
      })
      .catch(() => {
        if (!cancelled) setCanAdd(false)
      })
    return () => {
      cancelled = true
    }
  }, [handle])

  if (IS_WEB) return null
  if (!handle || handle === 'handle.invalid') return null
  if (canAdd !== true) return null

  const onPress = async () => {
    if (isAdding) return
    setIsAdding(true)
    ax.metric('invite:action:wallet', {platform: Platform.OS})
    try {
      const accessJwt = agent.session?.accessJwt
      if (!accessJwt) throw new Error('no session')
      let added: boolean
      if (Platform.OS === 'ios') {
        const res = await fetch(`${BSKY_WEB}/invite/pass.url`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessJwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({theme: themeKey}),
        })
        if (!res.ok) throw new Error(`pass.url ${res.status}`)
        const {url} = (await res.json()) as {url: string}
        added = await RNWallet.addPass(url)
      } else {
        const res = await fetch(
          `${BSKY_WEB}/invite/wallet/jwt?theme=${themeKey}`,
          {headers: {Authorization: `Bearer ${accessJwt}`}},
        )
        if (!res.ok) throw new Error(`wallet/jwt ${res.status}`)
        const {jwt} = (await res.json()) as {jwt: string}
        added = await RNWallet.addPassWithSignedJwt(jwt)
      }
      if (added) {
        Toast.show(l`Added to your wallet`)
      }
    } catch (err) {
      Toast.show(l`Could not add to wallet – please try again`, {type: 'error'})
      logger.error('InviteWallet: addPass failed', {safeMessage: err})
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <View
      style={[{alignItems: 'center'}, isAdding ? {opacity: 0.6} : null]}
      pointerEvents={isAdding ? 'none' : 'auto'}>
      <RNWallet.RNWalletView
        buttonStyle={RNWallet.ButtonStyle.BLACK}
        buttonType={RNWallet.ButtonType.PRIMARY}
        onPress={() => {
          void onPress()
        }}
      />
    </View>
  )
}

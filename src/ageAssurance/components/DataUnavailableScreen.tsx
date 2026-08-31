import {useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {usePdsClient, useSessionApi} from '#/state/session'
import {Error} from '#/components/Error'
import {EmojiSad_Stroke2_Corner0_Rounded as EmojiSadIcon} from '#/components/icons/Emoji'
import {refetchOtherRequiredData} from '#/ageAssurance/data'
import {IS_WEB} from '#/env'

export function DataUnavailableScreen() {
  const {t: l} = useLingui()
  const {logoutCurrentAccount} = useSessionApi()
  const accountClient = usePdsClient()
  const [isRetrying, setIsRetrying] = useState(false)

  const onRetry = async () => {
    setIsRetrying(true)
    try {
      await refetchOtherRequiredData({accountClient})
    } catch {
      // The error screen remains mounted so the user can retry again.
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <Error
      icon={EmojiSadIcon}
      title={l`Unable to load your account`}
      message={l`We couldn't load your account settings. Check your internet connection and try again.`}
      onRetry={onRetry}
      isRetrying={isRetrying}
      secondaryAction={{
        label: l`Sign out`,
        onPress: () => {
          if (IS_WEB) history.pushState(null, '', '/')
          logoutCurrentAccount('AgeAssuranceDataUnavailableScreen')
        },
      }}
    />
  )
}

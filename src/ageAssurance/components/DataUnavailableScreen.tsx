import {useLingui} from '@lingui/react/macro'

import {useSessionApi} from '#/state/session'
import {Error} from '#/components/Error'
import {EmojiSad_Stroke2_Corner0_Rounded as EmojiSadIcon} from '#/components/icons/Emoji'
import {useOtherRequiredDataQuery} from '#/ageAssurance/data'
import {IS_WEB} from '#/env'

export function DataUnavailableScreen() {
  const {t: l} = useLingui()
  const {logoutCurrentAccount} = useSessionApi()
  const {isFetching, refetch} = useOtherRequiredDataQuery()

  return (
    <Error
      icon={EmojiSadIcon}
      title={l`Unable to load your account`}
      message={l`We couldn't load your account settings. Check your internet connection and try again.`}
      onRetry={() => void refetch()}
      isRetrying={isFetching}
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

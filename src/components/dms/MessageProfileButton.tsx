import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {useMaybeConvoForUser} from '#/state/queries/messages/get-convo-for-members'
import {atoms as a, useTheme} from '#/alf'
import {ButtonIcon} from '#/components/Button'
import {canBeMessaged} from '#/components/dms/util'
import {Message_Stroke2_Corner0_Rounded as Message} from '#/components/icons/Message'
import {Link} from '#/components/Link'

export function MessageProfileButton({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileView
}) {
  const {_} = useLingui()
  const t = useTheme()

  const {data: convo, isPending} = useMaybeConvoForUser(profile.did)

  const onPress = React.useCallback(() => {
    if (convo && !convo.lastMessage) {
      logEvent('chat:create', {logContext: 'ProfileHeader'})
    }
    logEvent('chat:open', {logContext: 'ProfileHeader'})
  }, [convo])

  if (isPending) {
    // show pending state based on declaration
    if (canBeMessaged(profile)) {
      return (
        <View
          testID="dmBtnLoading"
          aria-hidden={true}
          style={[
            a.justify_center,
            a.align_center,
            t.atoms.bg_contrast_25,
            a.rounded_full,
            {width: 34, height: 34},
          ]}>
          <Message style={[t.atoms.text, {opacity: 0.3}]} size="md" />
        </View>
      )
    } else {
      return null
    }
  }

  if (convo) {
    return (
      <Link
        testID="dmBtn"
        size="small"
        color="secondary"
        variant="solid"
        shape="round"
        label={_(msg`Message ${profile.handle}`)}
        to={`/messages/${convo.id}`}
        style={[a.justify_center]}
        onPress={onPress}>
        <ButtonIcon icon={Message} size="md" />
      </Link>
    )
  } else {
    return null
  }
}

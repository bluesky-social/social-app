import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useMaybeConvoForUser} from '#/state/queries/messages/get-convo-for-members'
import {atoms as a, useTheme} from '#/alf'
import {Message_Stroke2_Corner0_Rounded as Message} from '../icons/Message'
import {Link} from '../Link'

export function MessageProfileButton({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileView
}) {
  const {_} = useLingui()
  const t = useTheme()

  const {data: convoId} = useMaybeConvoForUser(profile.did)

  if (!convoId) return null

  return (
    <Link
      testID="dmBtn"
      size="small"
      color="secondary"
      variant="solid"
      shape="round"
      label={_(msg`Message ${profile.handle}`)}
      to={`/messages/${convoId}`}
      style={[a.justify_center, {width: 36, height: 36}]}>
      <Message
        style={[t.atoms.text, {marginLeft: 1, marginBottom: 1}]}
        size="md"
      />
    </Link>
  )
}

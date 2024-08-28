import React from 'react'
import {AppBskyActorDefs} from '@atproto/api'

import {CenteredView} from 'view/com/util/Views'
import {client} from '#/screens/Login/LoginForm'
import {Text} from '#/components/Typography'

export function CallbackScreen() {
  const [profile, setProfile] = React.useState<AppBskyActorDefs.ProfileView>()
  React.useEffect(() => {
    ;(async () => {
      const res = await client.init()
      const profileRes = await res!.agent.request(
        '/xrpc/com.atproto.repo.getRecord?' +
          new URLSearchParams({
            repo: res!.agent.sub,
            collection: 'app.bsky.actor.profile',
            rkey: 'self',
          }).toString(),
      )
      const json = await profileRes?.json()
      setProfile(json.value)
    })()
  }, [])

  return (
    <CenteredView>
      <Text>{profile ? profile.displayName : 'Loading'}</Text>
    </CenteredView>
  )
}

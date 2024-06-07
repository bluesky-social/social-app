import React from 'react'
import {AtUri} from '@atproto/api'
import {z} from 'zod'

import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {UserAvatar} from '#/view/com/util/UserAvatar'

const avatarProps = z.object({
  uri: z.string(),
  size: z.number().default(50),
})

export type AvatarProps = z.infer<typeof avatarProps>

export function Avatar(props: React.PropsWithChildren<AvatarProps>) {
  const propsParsed = avatarProps.parse(props)
  const urip = new AtUri(propsParsed.uri)

  const {data: did} = useResolveDidQuery(urip.host)
  const {data: profile} = useProfileQuery({did})

  return <UserAvatar avatar={profile?.avatar} size={propsParsed.size} />
}

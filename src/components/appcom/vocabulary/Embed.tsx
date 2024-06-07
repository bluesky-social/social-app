import React from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/api'
import {z} from 'zod'

import {usePostQuery} from '#/state/queries/post'
import {useProfileQuery} from '#/state/queries/profile'
import {useResolveDidQuery} from '#/state/queries/resolve-uri'
import {Post as PostInner} from '#/view/com/post/Post'
import {ProfileCardWithFollowBtn} from '#/view/com/profile/ProfileCard'
import {Text} from '#/components/Typography'

const embedProps = z.object({
  uri: z.string(),
})

export type ProfileCardProps = z.infer<typeof embedProps>

export function Embed(props: React.PropsWithChildren<ProfileCardProps>) {
  const propsParsed = embedProps.parse(props)
  const urip = new AtUri(propsParsed.uri)
  console.log(urip)

  if (!urip.pathname || urip.pathname === '/') {
    return <Actor actor={urip.host} />
  }
  if (urip.collection === 'app.bsky.feed.post') {
    return <Post uri={urip.toString()} />
  }
  return <Unknown urip={urip} />
}

function Actor({actor}: {actor: string}) {
  const {data: did} = useResolveDidQuery(actor)
  const {data: profile} = useProfileQuery({did})

  if (profile) {
    return <ProfileCardWithFollowBtn noBg noBorder profile={profile} />
  }
  // TODO error, loading
  return <View />
}

function Post({uri}: {uri: string}) {
  const {data: post} = usePostQuery(uri)
  if (post) {
    return <PostInner post={post} hideTopBorder />
  }
  // TODO error, loading
  return <View />
}

function Unknown({urip}: {urip: AtUri}) {
  return (
    <View style={{paddingVertical: 10, paddingHorizontal: 15}}>
      <Text>Unsupported record type: {urip.collection}</Text>
    </View>
  )
}

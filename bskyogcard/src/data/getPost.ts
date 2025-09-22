import {AtpAgent, AtUri} from '@atproto/api'

export async function getPost({uri, agent}: {uri: AtUri; agent: AtpAgent}) {
  if (!uri.hostname.startsWith('did:')) {
    const res = await agent.resolveHandle({
      handle: uri.hostname,
    })
    uri.hostname = res.data.did
  }
  const {data} = await agent.getPosts({
    uris: [uri.toString()],
  })
  return data.posts.at(0)
}

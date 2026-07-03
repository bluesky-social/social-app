import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {PostThread} from '#/screens/PostThread'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const {name, rkey: rawRkey, collection: rawCollection} = route.params
  // Old share links percent-encoded '?collection=...' into the rkey segment.
  let rkey = decodeURIComponent(rawRkey)
  let collection = rawCollection
  const qIndex = rkey.indexOf('?')
  if (qIndex !== -1) {
    const qs = new URLSearchParams(rkey.slice(qIndex + 1))
    collection = collection || qs.get('collection') || undefined
    rkey = rkey.slice(0, qIndex)
  }
  const uri = makeRecordUri(name, collection || 'app.bsky.feed.post', rkey)

  return (
    <Layout.Screen testID="postThreadScreen">
      <PostThread uri={uri} />
    </Layout.Screen>
  )
}

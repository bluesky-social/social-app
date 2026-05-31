import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {makeRecordUri} from '#/lib/strings/url-helpers'
import {PostThread} from '#/screens/PostThread'
import * as Layout from '#/components/Layout'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>
export function PostThreadScreen({route}: Props) {
  const {name, rkey} = route.params
  const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey)

  return (
    <Layout.Screen testID="postThreadScreen">
      <PostThread uri={uri} />
    </Layout.Screen>
  )
}

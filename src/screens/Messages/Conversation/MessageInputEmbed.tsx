import React, {useEffect, useState} from 'react'
import {ActivityIndicator, View} from 'react-native'
import {AppBskyEmbedRecord, AppBskyFeedDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {useAgent} from '#/state/session'
import {MaybeQuoteEmbed} from '#/view/com/util/post-embeds/QuoteEmbed'
import {atoms as a, useTheme} from '#/alf'
import {PostMeta} from '#/view/com/util/PostMeta'
import {RichText} from '#/components/RichText'

export function MessageInputEmbed({
  message,
}: {
  message: string
  setMessage: (message: string) => void
}) {
  const {getAgent} = useAgent()
  const t = useTheme()
  const [url, setUrl] = useState<string | null>(
    'https://bsky.app/profile/retr0.id/post/3krylejlvke2j',
  )

  useEffect(() => {}, [message])

  const query = useQuery({
    queryKey: ['post-message-embed', url],
    queryFn: async () => {
      if (!url) return null
      const urlp = new URL(url)
      const [, , didOrHandle, _, rkey] = urlp.pathname.split('/')
      let did = didOrHandle
      if (!didOrHandle.startsWith('did:')) {
        did = (await getAgent().resolveHandle({handle: didOrHandle})).data.did
      }
      const uri = `at://${did}/app.bsky.feed.post/${rkey}`
      const {data} = await getAgent().api.app.bsky.feed.getPostThread({
        uri,
        depth: 1,
        parentHeight: 0,
      })
      return data
    },
    enabled: !!url,
  })

  if (!url || query.isError) {
    return null
  }

  if (query.isPending) {
    //temp
    return <ActivityIndicator />
  }

  if (query.data) {
    if (!AppBskyFeedDefs.isThreadViewPost(query.data.thread)) return null
    return (
      <View
        pointerEvents="none"
        style={(a.border, a.rounded_2xs, t.atoms.border_contrast_high)}>
        <PostMeta
          author={query.data.thread.post.author}
          showAvatar
          authorHasWarning={false}
          timestamp={query.data.thread.post.indexedAt}
        />
        {richText ? (
          <RichText
            value={richText}
            style={[a.text_md]}
            numberOfLines={20}
            disableLinks
          />
        ) : null}
      </View>
    )
  }

  return null
}

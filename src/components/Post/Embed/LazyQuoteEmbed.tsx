import {useMemo} from 'react'
import {View} from 'react-native'

import {createEmbedViewRecordFromPost} from '#/state/queries/postgate/util'
import {useResolveLinkQuery} from '#/state/queries/resolve-link'
import {atoms as a, useTheme} from '#/alf'
import {QuoteEmbed, QuoteEmbedViewContext} from '#/components/Post/Embed'
import {embedHasMedia} from '#/components/Post/Embed/util'
import {parseEmbed} from '#/types/bsky/post'

export function LazyQuoteEmbed({
  uri,
  parentHasMedia,
}: {
  uri: string
  parentHasMedia?: boolean
}) {
  const t = useTheme()
  const {data} = useResolveLinkQuery(uri)

  const view = useMemo(() => {
    if (!data || data.type !== 'record' || data.kind !== 'post') return
    return createEmbedViewRecordFromPost(data.view)
  }, [data])

  // Determine if we should use compact layout
  const viewContext = useMemo(() => {
    if (!parentHasMedia || !view) return undefined
    const quotedEmbed = view.embeds?.[0]
      ? parseEmbed(view.embeds[0])
      : undefined
    if (embedHasMedia(quotedEmbed)) {
      return QuoteEmbedViewContext.CompactWithMedia
    }
    return undefined
  }, [parentHasMedia, view])

  return view ? (
    <QuoteEmbed
      embed={{
        type: 'post',
        view,
      }}
      viewContext={viewContext}
    />
  ) : (
    <View
      style={[
        a.w_full,
        a.rounded_md,
        t.atoms.bg_contrast_25,
        {
          height: 68,
        },
      ]}
    />
  )
}

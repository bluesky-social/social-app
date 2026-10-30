import {useMemo} from 'react'
import {View} from 'react-native'

import {createEmbedViewRecordFromPost} from '#/state/queries/postgate/util'
import {useResolveLinkQuery} from '#/state/queries/resolve-link'
import {atoms as a, useTheme} from '#/alf'
import {QuoteEmbed} from '#/components/Post/Embed'
import {type CommonProps} from '#/components/Post/Embed/types'

export function LazyQuoteEmbed({
  uri,
  linkDisabled,
  quotePresentation,
}: {
  uri: string
  linkDisabled?: boolean
  quotePresentation?: CommonProps['quotePresentation']
}) {
  const t = useTheme()
  const {data} = useResolveLinkQuery(uri)

  const view = useMemo(() => {
    if (!data || data.type !== 'record' || data.kind !== 'post') return
    return createEmbedViewRecordFromPost(data.view)
  }, [data])

  return view ? (
    <QuoteEmbed
      embed={{
        type: 'post',
        view,
      }}
      linkDisabled={linkDisabled}
      quotePresentation={quotePresentation}
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

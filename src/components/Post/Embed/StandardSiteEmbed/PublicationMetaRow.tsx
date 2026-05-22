import {Fragment, type ReactNode, useMemo} from 'react'
import {View} from 'react-native'
import {type AppBskyEmbedExternal} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {useProfileQuery} from '#/state/queries/profile'
import {atoms as a, useTheme} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

export function PublicationMetaRow({
  view,
  author,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  author: {did: string | null | undefined}
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const profileQuery = useProfileQuery({did: author.did ?? undefined})
  const handle = author.did ? profileQuery.data?.handle : undefined
  const highlightedPublisher = useMemo(() => {
    try {
      const u = new URL(view.source?.uri || '')
      return (
        u.host.endsWith('leaflet.pub') ||
        u.host.endsWith('pckt.blog') ||
        u.host.endsWith('offprint.app')
      )
    } catch (e) {
      return false
    }
  }, [view])

  const metaTextStyle = [
    a.text_xs,
    a.leading_snug,
    t.atoms.text_contrast_medium,
  ]

  const items: {key: string; node: ReactNode}[] = []

  if (!highlightedPublisher && view.source?.uri) {
    items.push({
      key: 'domain',
      node: (
        <Text numberOfLines={1} style={metaTextStyle}>
          {toNiceDomain(view.source.uri)}
        </Text>
      ),
    })
  }

  if (author.did && handle) {
    items.push({
      key: 'author',
      node: (
        <Text numberOfLines={1} style={metaTextStyle}>
          <Trans>
            by{' '}
            <InlineLinkText
              label={l`View @${handle}'s profile`}
              to={makeProfileLink({did: author.did, handle})}
              style={metaTextStyle}>
              @{handle}
            </InlineLinkText>
          </Trans>
        </Text>
      ),
    })
  }

  if (items.length === 0) return null

  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs]}>
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {i > 0 && <Text style={metaTextStyle}>•</Text>}
          {item.node}
        </Fragment>
      ))}
    </View>
  )
}

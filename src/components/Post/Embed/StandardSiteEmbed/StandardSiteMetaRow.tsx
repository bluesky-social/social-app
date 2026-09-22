import {Fragment, type ReactNode} from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {Trans} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import {
  matchStandardSitePublisher,
  matchStandardSitePublisherByUri,
} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import type * as ssTypes from '#/components/Post/Embed/StandardSiteEmbed/types'
import {
  isStandardSiteDocumentUri,
  isStandardSitePublicationUri,
} from '#/components/Post/Embed/StandardSiteEmbed/utils'
import {Text} from '#/components/Typography'

export function StandardSiteMetaRow({
  authorDid: authorDidProp,
  type = 'document',
  view,
}: ssTypes.CommonProps &
  ssTypes.PreviewProps & {
    type?: 'document' | 'publication'
  }) {
  const t = useTheme()
  const highlightedPublisher = !!matchStandardSitePublisher(view)
  const didsFromRecords =
    view.associatedRefs
      ?.filter(
        type === 'document'
          ? isStandardSiteDocumentUri
          : isStandardSitePublicationUri,
      )
      .map(ref => new AtUri(ref.uri).host) || []
  // atm should only be one docment
  const authorDid = didsFromRecords.at(0) || authorDidProp
  const authorProfile = authorDid
    ? view.associatedProfiles?.find(p => p.did === authorDid)
    : undefined
  const authorHandle = authorProfile?.handle
  const articleDomain = toNiceDomain(view.uri)
  const articlePublisher = matchStandardSitePublisherByUri(view.uri)
  const domainHandleMatch =
    authorHandle &&
    (articleDomain === authorHandle ||
      articleDomain.endsWith(`.${authorHandle}`))
  const DomainIcon = articlePublisher?.Icon
  const metaTextStyle = [
    a.text_xs,
    a.leading_tight,
    t.atoms.text_contrast_medium,
  ]

  const items: {key: string; node: ReactNode}[] = []

  if (!highlightedPublisher && !domainHandleMatch) {
    items.push({
      key: 'domain',
      node: (
        <View style={[a.flex_shrink, a.flex_row, a.align_center, a.gap_2xs]}>
          {DomainIcon && (
            <DomainIcon size="xs" fill={t.atoms.text_contrast_medium.color} />
          )}
          <Text numberOfLines={1} style={[metaTextStyle, a.flex_shrink]}>
            {articleDomain}
          </Text>
        </View>
      ),
    })
  }

  if (authorHandle) {
    items.push({
      key: 'author',
      node: (
        <Text numberOfLines={1} style={[metaTextStyle]}>
          <Trans>by @{authorHandle}</Trans>
        </Text>
      ),
    })
  }

  if (items.length === 0) return null

  return (
    <View style={[a.flex_row, a.align_center, a.gap_xs, a.z_10]}>
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {i > 0 && <Text style={metaTextStyle}>•</Text>}
          {item.node}
        </Fragment>
      ))}
    </View>
  )
}

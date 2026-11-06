import {Fragment, type ReactNode} from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {Trans} from '@lingui/react/macro'

import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import {matchStandardSiteHostByUrl} from '#/components/atmosphere/SiteStandard/publishers'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {
  isStandardSiteDocumentUri,
  isStandardSitePublicationUri,
} from '#/components/atmosphere/SiteStandard/utils'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLinkIcon} from '#/components/icons/ChainLink'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

export function StandardSiteMetaRow({
  type = 'document',
  view,
}: ssTypes.PreviewProps & {
  view:
    | app.bsky.embed.external.ViewArticle
    | app.bsky.embed.external.ViewArticlePublication
  type?: 'document' | 'publication'
}) {
  const t = useTheme()
  const didsFromRecords =
    view.associatedRefs
      ?.filter(
        type === 'document'
          ? isStandardSiteDocumentUri
          : isStandardSitePublicationUri,
      )
      .map(ref => new AtUri(ref.uri).host) || []
  // atm should only be one docment
  const authorDid = didsFromRecords.at(0)
  const authorProfile = authorDid
    ? view.associatedProfiles?.find(p => p.did === authorDid)
    : undefined
  const articleDomain = toNiceDomain(view.uri)
  const articlePublisher = matchStandardSiteHostByUrl(view.uri)
  const highlightedPublisher = type === 'publication' && !!articlePublisher
  const domainHandleMatch =
    authorProfile?.handle &&
    (articleDomain === authorProfile.handle ||
      articleDomain.endsWith(`.${authorProfile.handle}`))
  const metaTextStyle = [
    a.text_xs,
    a.leading_tight,
    t.atoms.text_contrast_medium,
  ]

  const items: {key: string; node: ReactNode}[] = []

  if (authorProfile) {
    items.push({
      key: 'author',
      node: (
        <Text numberOfLines={1} style={[metaTextStyle]}>
          <Trans>by @{authorProfile.handle}</Trans>
        </Text>
      ),
    })
  }

  if (!highlightedPublisher && !domainHandleMatch) {
    items.push({
      key: 'domain',
      node: (
        <View style={[a.flex_shrink, a.flex_row, a.align_center, a.gap_2xs]}>
          <ChainLinkIcon size="xs" fill={t.atoms.text_contrast_medium.color} />
          <Text numberOfLines={1} style={[metaTextStyle, a.flex_shrink]}>
            {articleDomain}
          </Text>
        </View>
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

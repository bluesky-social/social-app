import {Fragment, type ReactNode} from 'react'
import {View} from 'react-native'
import {type AppBskyEmbedExternal, AtUri} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import {StandardSite} from '#/components/icons/community/StandardSite'
import {InlineLinkText} from '#/components/Link'
import {
  matchStandardSitePublisher,
  matchStandardSitePublisherByUri,
} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {isStandardSiteDocumentUri} from '#/components/Post/Embed/StandardSiteEmbed/utils'
import {Text} from '#/components/Typography'

export function PublicationMetaRow({
  view,
  onInteractWithin,
  onInteractWithout,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  onInteractWithin: () => void
  onInteractWithout: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const highlightedPublisher = !!matchStandardSitePublisher(view)
  const didsFromRecords =
    view.associatedRefs
      ?.filter(isStandardSiteDocumentUri)
      .map(ref => new AtUri(ref.uri).host) || []
  // atm should only be one docment
  const authorDid = didsFromRecords.at(0)
  const authorProfile = authorDid
    ? view.associatedProfiles?.find(p => p.did === authorDid)
    : undefined
  const articleDomain = toNiceDomain(view.uri)
  const articlePublisher = matchStandardSitePublisherByUri(view.uri)
  const DomainIcon = articlePublisher?.Icon ?? StandardSite
  const metaTextStyle = [
    a.text_xs,
    a.leading_snug,
    t.atoms.text_contrast_medium,
  ]

  const items: {key: string; node: ReactNode}[] = []

  if (!highlightedPublisher) {
    items.push({
      key: 'domain',
      node: (
        <View style={[a.flex_row, a.align_center]}>
          <DomainIcon size="sm" fill={t.atoms.text_contrast_medium.color} />
          <Text numberOfLines={1} style={metaTextStyle}>
            {articleDomain}
          </Text>
        </View>
      ),
    })
  }

  if (authorProfile) {
    items.push({
      key: 'author',
      node: (
        <Text numberOfLines={1} style={metaTextStyle}>
          <Trans>
            by{' '}
            <InlineLinkText
              label={l`View @${authorProfile.handle}'s profile`}
              to={makeProfileLink(authorProfile)}
              style={metaTextStyle}
              onPress={e => {
                // this link is nested, yes it's not ideal
                e.stopPropagation()
              }}
              onMouseEnter={onInteractWithin}
              onMouseLeave={onInteractWithout}>
              @{authorProfile.handle}
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

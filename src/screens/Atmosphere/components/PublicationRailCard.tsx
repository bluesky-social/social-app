import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {sanitizeHandle} from '#/lib/strings/handles'
import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme} from '#/alf'
import {useCardSurface} from '#/components/atmosphere/cardSurface'
import {getAtmosphereProvider} from '#/components/atmosphere/providers'
import {AccentLinkButton} from '#/components/atmosphere/SiteStandard/AccentLinkButton'
import {getPublicationAuthor} from '#/components/atmosphere/SiteStandard/Publication'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {type ItemFocusProps} from '#/components/Gallery'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app, site} from '#/lexicons'
import {AtmosphereCardMenu} from './AtmosphereCardMenu'

const ICON_SIZE = 72

/**
 * A publication as a tall card for a rail: its icon, name, author and
 * description centered, who subscribes, and a link to read it in the app it's
 * published with, tinted with its accent color.
 */
export function PublicationRailCard({
  publication,
  width,
  onPressCallback,
  galleryFocus,
}: {
  publication: app.bsky.embed.external.ViewArticlePublication
  width: number
  /** `card` for the icon and name, `cta` for the button. */
  onPressCallback?: (source: 'card' | 'cta') => void
  galleryFocus?: ItemFocusProps
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const author = getPublicationAuthor(publication)
  const provider = getAtmosphereProvider(publication.providerId)
  const accent = getPublicationTheme(publication)?.accent
  const surface = useCardSurface()
  const title = publication.title
  const openLabel = title ? l`View ${title}` : l`View publication`
  const viewLabel = provider
    ? l({
        message: `View on ${provider.name}`,
        comment:
          'Button that opens a publication in the app it’s published with, e.g. “View on Leaflet”. {name} is the app’s name.',
      })
    : l`View publication`

  return (
    <View
      testID="publicationRailCard"
      style={[
        a.flex_grow,
        a.align_center,
        a.gap_sm,
        a.p_lg,
        a.rounded_lg,
        surface.style,
        {width},
      ]}>
      <View style={[a.absolute, {top: 4, right: 4}]}>
        <AtmosphereCardMenu
          inline
          type="publication"
          item={publication}
          reportableTypes={[site.standard.publication.$type]}
          author={author}
        />
      </View>
      <Link
        to={publication.uri}
        shouldProxy
        label={openLabel}
        accessibilityHint=""
        onPress={() => onPressCallback?.('card')}
        style={[a.flex_col, a.align_center, a.gap_xs, a.w_full, a.pt_sm]}>
        <View style={[a.pb_sm]}>
          <PublicationIcon view={publication} size={ICON_SIZE} />
        </View>
        <Text
          emoji
          numberOfLines={1}
          style={[a.text_md, a.font_semi_bold, a.text_center, t.atoms.text]}>
          {title}
        </Text>
        {author && (
          <Text
            numberOfLines={1}
            style={[a.text_sm, a.text_center, t.atoms.text_contrast_medium]}>
            {sanitizeHandle(author.handle, '@')}
          </Text>
        )}
      </Link>
      {!!publication.description && (
        <Text
          emoji
          numberOfLines={2}
          style={[
            a.text_sm,
            a.leading_snug,
            a.text_center,
            t.atoms.text_contrast_high,
          ]}>
          {publication.description}
        </Text>
      )}
      {(!!publication.subscribers?.length ||
        !!publication.subscriptionCount) && (
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          {!!publication.subscribers?.length && (
            <AvatarStack
              size={18}
              profiles={publication.subscribers.slice(0, 3)}
              backgroundColor={surface.fill}
            />
          )}
          {!!publication.subscriptionCount && (
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              {l({
                message: plural(publication.subscriptionCount, {
                  one: `${formatCount(i18n, publication.subscriptionCount)} subscriber`,
                  other: `${formatCount(i18n, publication.subscriptionCount)} subscribers`,
                }),
                comment: 'Number of people subscribed to a publication.',
              })}
            </Text>
          )}
        </View>
      )}
      <View style={[a.w_full, a.mt_auto, a.pt_xs]}>
        <AccentLinkButton
          testID="publicationRailCardView"
          to={publication.uri}
          shouldProxy
          label={viewLabel}
          accessibilityHint=""
          accent={accent}
          onPress={() => onPressCallback?.('cta')}
          ref={galleryFocus?.focusRef}
          tabIndex={galleryFocus?.tabIndex}
          onFocus={galleryFocus?.onFocus}
        />
      </View>
    </View>
  )
}

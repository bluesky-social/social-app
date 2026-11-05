import {type StyleProp, View, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {atoms as a, utils} from '#/alf'
import {matchStandardSitePublisher} from '#/components/atmosphere/SiteStandard/publishers'
import {StandardSiteThemeProvider} from '#/components/atmosphere/SiteStandard/StandardSiteThemeProvider'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Link, type LinkProps} from '#/components/Link'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'

export function SubscribeButton({
  preview,
  view,
  style,
  linkProps,
  onEmbedInteractionCallback,
}: ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticlePublication
    style?: StyleProp<ViewStyle>
    linkProps?: Pick<LinkProps, 'tabIndex' | 'onFocus'>
  }) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const haptics = useHaptics()

  const highlightedPublisher = matchStandardSitePublisher(view)
  const cta = highlightedPublisher
    ? l`Subscribe on ${highlightedPublisher.name}`
    : l`View publication`

  /*
   * The custom site theme paints the button background with `accent` and the
   * text with `accentForeground`. Only honor it when that pairing clears WCAG
   * AAA (4.5:1) for large text, which the button's bold label qualifies as.
   * Otherwise we fall through to the default `secondary_inverted` styling,
   * which is guaranteed to be legible.
   */
  const theme = getPublicationTheme(view)
  const ratio = theme
    ? utils.contrastRatio(theme.accent, theme.accentForeground)
    : null
  const useCustomTheme = ratio !== null && ratio >= 4.5

  const publicationTitle = view.title
  const label = highlightedPublisher
    ? publicationTitle
      ? l`Subscribe to ${publicationTitle} on ${highlightedPublisher.name}`
      : l`Subscribe on ${highlightedPublisher.name}`
    : publicationTitle
      ? l`View ${publicationTitle}`
      : l`View publication`

  const onPress = () => {
    haptics.tap()
    onEmbedInteractionCallback?.()
    if (highlightedPublisher) {
      ax.metric('embed:standardSite:subscribe:press', {
        url: view.uri,
      })
    } else {
      ax.metric('embed:standardSite:publicationCta:press', {
        url: view.uri,
      })
    }
  }

  const onLongPress = IS_NATIVE
    ? () => {
        haptics.longPress()
        void shareUrl(view.uri)
        if (highlightedPublisher) {
          ax.metric('embed:standardSite:subscribe:longPress', {
            url: view.uri,
          })
        } else {
          ax.metric('embed:standardSite:publicationCta:longPress', {
            url: view.uri,
          })
        }
      }
    : undefined

  const button = (
    <Link
      shouldProxy
      to={view.uri}
      label={label}
      size="small"
      color="secondary_inverted"
      tabIndex={linkProps?.tabIndex}
      onFocus={linkProps?.onFocus}
      style={[
        style,
        a.gap_sm,
        preview ? a.pointer_events_none : a.pointer_events_auto,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}>
      {highlightedPublisher ? (
        <>
          <View style={[a.flex_row, a.align_center, {gap: 7}]}>
            <ButtonIcon icon={highlightedPublisher.Icon} size="md" />
          </View>
          <ButtonText>{cta}</ButtonText>
        </>
      ) : (
        <>
          <ButtonText>{cta}</ButtonText>
          <ButtonIcon icon={ArrowTopRightIcon} />
        </>
      )}
    </Link>
  )

  if (!useCustomTheme) {
    return button
  }

  return (
    <StandardSiteThemeProvider view={view}>{button}</StandardSiteThemeProvider>
  )
}

import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {atoms as a, extractPadding, useTheme, web} from '#/alf'
import {DocumentPublicationRow} from '#/components/atmosphere/SiteStandard/DocumentPublicationRow'
import {DocumentStats} from '#/components/atmosphere/SiteStandard/DocumentStats'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app, site} from '#/lexicons'

type DocumentCompactProps = ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticle
    /**
     * Applied to the outer wrapper around the article link and its menu, so
     * outer layout (margins, flex) moves both together.
     */
    style?: StyleProp<ViewStyle>
    /**
     * Insets the article content and its independent menu. Padding stays
     * inside the article link's hit area. The menu follows the resolved
     * padding. Use this, not `style`, to inset rows in a list.
     */
    containerStyle?: StyleProp<ViewStyle>
  }

/**
 * Fills its host column with no outer padding, border, or rounding of its own.
 */
export function DocumentCompact(props: DocumentCompactProps) {
  return <DocumentCompactBase {...props} card={false} />
}

/**
 * The framed presentation: bordered, rounded, and inset.
 */
export function DocumentCompactCard({
  containerStyle,
  ...props
}: DocumentCompactProps) {
  return (
    <DocumentCompactBase
      {...props}
      card
      containerStyle={[a.p_md, containerStyle]}
    />
  )
}

function DocumentCompactBase({
  card,
  preview,
  view,
  onEmbedInteractionCallback,
  style,
  containerStyle,
}: DocumentCompactProps & {card: boolean}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const niceUrl = toNiceDomain(view.uri)
  const publisher = view.publisher
  const {paddingTop, paddingRight} = extractPadding(containerStyle)
  /* A sibling of the article link; interactive elements can't nest in one. */
  const hasMenu = !preview
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  const onPress = () => {
    haptics.tap()
    onEmbedInteractionCallback?.()
    ax.metric('embed:standardSite:article:press', {url: view.uri})
  }
  const onLongPress = IS_NATIVE
    ? () => {
        if (view.uri) {
          haptics.longPress()
          void shareUrl(view.uri)
          ax.metric('embed:standardSite:article:longPress', {url: view.uri})
        }
      }
    : undefined

  return (
    <View style={[a.relative, style]}>
      <Link
        testID={card ? 'documentCompactCard' : 'documentCompact'}
        peek
        shouldProxy
        to={view.uri}
        label={view.title || l`Open link to ${niceUrl}`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          /* Override Button's row/center layout so the padded content stretches. */
          a.flex_col,
          a.align_stretch,
          a.w_full,
          card && [a.rounded_lg, a.border],
          preview && a.pointer_events_none,
          /*
           * The peek lifts this view on a clear background, so it needs its own
           * fill for the padding to show.
           */
          t.atoms.bg,
          interacted && t.atoms.bg_contrast_25,
          card &&
            (interacted
              ? t.atoms.border_contrast_high
              : t.atoms.border_contrast_low),
        ]}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={onInteract}
        onBlur={onInteractOut}>
        <View style={containerStyle}>
          <View style={[a.w_full, a.gap_sm]}>
            {!!publisher && (
              <View
                style={[
                  a.justify_center,
                  hasMenu && a.pr_5xl,
                  {minHeight: 20},
                ]}>
                {publisher && <DocumentPublicationRow view={publisher} />}
              </View>
            )}

            <View style={[a.flex_row, a.align_start, a.gap_md]}>
              <View style={[a.flex_1, a.gap_xs, {minWidth: 0}]}>
                <Text
                  emoji
                  numberOfLines={2}
                  style={[a.text_lg, a.font_bold, a.leading_snug]}>
                  {view.title}
                </Text>
                {!!view.description && (
                  <Text
                    emoji
                    numberOfLines={3}
                    style={[a.text_sm, a.leading_snug, {maxWidth: 360}]}>
                    {view.description}
                  </Text>
                )}
              </View>

              {!!view.image && (
                <Image
                  source={{uri: view.image}}
                  contentFit="cover"
                  style={[
                    a.flex_shrink_0,
                    a.rounded_lg,
                    {width: 80, height: 80},
                  ]}
                  accessible={false}
                  accessibilityIgnoresInvertColors
                  loading="lazy"
                  useAppleWebpCodec
                />
              )}
            </View>

            <DocumentStats view={view} />
          </View>
        </View>
      </Link>

      {hasMenu && (
        <AtmosphereCardMenu
          type="article"
          item={view}
          reportableTypes={[site.standard.document.$type]}
          author={view.associatedProfiles?.[0]}
          offsetY={paddingTop}
          offsetX={paddingRight}
        />
      )}
    </View>
  )
}

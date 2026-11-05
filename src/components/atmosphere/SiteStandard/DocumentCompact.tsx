import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {atoms as a, useTheme, web} from '#/alf'
import {DocumentPublicationRow} from '#/components/atmosphere/SiteStandard/DocumentPublicationRow'
import {DocumentStats} from '#/components/atmosphere/SiteStandard/DocumentStats'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app, site} from '#/lexicons'

export function DocumentCompact({
  preview,
  view,
  onEmbedInteractionCallback,
  style,
}: ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticle
    style?: StyleProp<ViewStyle>
  }) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const niceUrl = toNiceDomain(view.uri)
  const publisher = view.publisher
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
    <View
      testID="documentCompact"
      style={[
        a.flex_col,
        a.rounded_lg,
        a.w_full,
        a.border,
        interacted ? t.atoms.border_contrast_high : t.atoms.border_contrast_low,
        preview && a.pointer_events_none,
        style,
      ]}>
      <Link
        peek
        shouldProxy
        to={view.uri}
        label={view.title || l`Open link to ${niceUrl}`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[a.rounded_lg]}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={onInteract}
        onBlur={onInteractOut}>
        {({pressed}) => (
          <View
            style={[
              a.w_full,
              a.gap_sm,
              a.p_md,
              a.rounded_lg,
              a.overflow_hidden,
              interacted ? t.atoms.bg_contrast_25 : pressed && t.atoms.bg,
            ]}>
            {!!(publisher || hasMenu) && (
              <View
                style={[
                  a.justify_center,
                  hasMenu && a.pr_5xl,
                  {minHeight: 28},
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
        )}
      </Link>

      {hasMenu && (
        <AtmosphereCardMenu
          type="article"
          item={view}
          reportableTypes={[site.standard.document.$type]}
          author={view.associatedProfiles?.[0]}
        />
      )}
    </View>
  )
}

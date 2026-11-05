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
import {StandardSiteMetaRow} from '#/components/atmosphere/SiteStandard/StandardSiteMetaRow'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {Divider} from '#/components/Divider'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app, site} from '#/lexicons'

export function Document({
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
  const imageUri = view.image
  const publisher = view.publisher
  const hasMedia = Boolean(imageUri)
  /*
   * The menu is a sibling of the article link, not inside it, since
   * interactive elements can't nest in one. With no image to hold it, content
   * that would sit under it is padded away.
   */
  const hasMenu = !preview
  const menuClearance = hasMenu && !hasMedia && a.pr_5xl

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
      style={[
        a.flex_col,
        a.rounded_lg,
        a.w_full,
        a.border,
        interacted ? t.atoms.border_contrast_high : t.atoms.border_contrast_low,
        preview && a.pointer_events_none,
        style,
      ]}>
      {/*
       * The article is an in-flow `Link` wrapping the content so the iOS peek
       * menu has something to lift.
       */}
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
              /*
               * The inner view clips and rounds, not the container, since
               * overflow_hidden on the container breaks the peek lift animation.
               */
              a.overflow_hidden,
              a.rounded_lg,
              interacted ? t.atoms.bg_contrast_25 : pressed && t.atoms.bg,
            ]}>
            {imageUri ? (
              <Image
                style={[a.aspect_card]}
                source={{uri: imageUri}}
                accessibilityIgnoresInvertColors
                loading="lazy"
                useAppleWebpCodec
              />
            ) : undefined}

            <View
              style={[
                a.flex_1,
                a.pt_md,
                hasMedia && a.border_t,
                interacted
                  ? t.atoms.border_contrast_high
                  : t.atoms.border_contrast_low,
                {gap: 3},
              ]}>
              <View style={[a.pb_sm, a.px_md, {gap: 5}]}>
                {publisher && (
                  <DocumentPublicationRow
                    view={publisher}
                    style={menuClearance}
                  />
                )}
                <View style={[{gap: 3}]}>
                  <Text
                    emoji
                    numberOfLines={3}
                    style={[
                      a.text_lg,
                      a.font_bold,
                      a.leading_snug,
                      !publisher && menuClearance,
                    ]}>
                    {view.title}
                  </Text>
                  {view.description ? (
                    <Text
                      emoji
                      numberOfLines={imageUri ? 2 : 4}
                      style={[a.text_sm, a.leading_snug]}>
                      {view.description}
                    </Text>
                  ) : undefined}
                </View>

                <DocumentStats view={view} />
              </View>
            </View>

            {!publisher && (
              <View style={[a.px_md]}>
                <Divider />
                <View style={[a.py_sm]}>
                  <StandardSiteMetaRow preview={preview} view={view} />
                </View>
              </View>
            )}
          </View>
        )}
      </Link>

      {hasMenu && (
        <AtmosphereCardMenu
          type="article"
          item={view}
          reportableTypes={[site.standard.document.$type]}
          author={view.associatedProfiles?.[0]}
          offsetY={a.p_sm.padding}
          offsetX={a.p_sm.padding}
        />
      )}
    </View>
  )
}

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

type DocumentProps = ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticle
    /**
     * Applied to the outer frame.
     */
    style?: StyleProp<ViewStyle>
    /**
     * Applied last to an inset wrapper around the article and its menu, so
     * padding moves both together. Use this, not `style`, to inset rows in a
     * list.
     */
    containerStyle?: StyleProp<ViewStyle>
  }

/**
 * Fills its host column with no outer padding, border, or rounding of its own.
 */
export function Document(props: DocumentProps) {
  return <DocumentBase {...props} card={false} />
}

/**
 * The framed presentation: bordered, rounded, and inset.
 */
export function DocumentCard({containerStyle, ...props}: DocumentProps) {
  return (
    <DocumentBase {...props} card containerStyle={[a.p_md, containerStyle]} />
  )
}

function DocumentBase({
  card,
  preview,
  view,
  onEmbedInteractionCallback,
  style,
  containerStyle,
}: DocumentProps & {card: boolean}) {
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
   * interactive elements can't nest in one. With no image to hold it, the
   * first row is padded away from it and kept at least as tall as its trigger.
   */
  const hasMenu = !preview
  const menuClearance = hasMenu && !hasMedia && [a.pr_5xl, {minHeight: 28}]

  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()
  const borderColor = interacted
    ? t.atoms.border_contrast_high
    : t.atoms.border_contrast_low
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
      testID={card ? 'documentCard' : 'document'}
      style={[
        a.flex_col,
        a.w_full,
        card && [a.rounded_lg, a.border, borderColor],
        /* The inset sits outside the link, so tint the frame too. */
        interacted && t.atoms.bg_contrast_25,
        preview && a.pointer_events_none,
        style,
      ]}>
      <View style={containerStyle}>
        <View style={a.relative}>
          {/*
           * The article is an in-flow `Link` wrapping the content so the iOS
           * peek menu has something to lift.
           */}
          <Link
            peek
            shouldProxy
            to={view.uri}
            label={view.title || l`Open link to ${niceUrl}`}
            onPress={onPress}
            onLongPress={onLongPress}
            style={card && a.rounded_lg}
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
                   * overflow_hidden on the container breaks the peek lift
                   * animation.
                   */
                  card && [a.rounded_lg, a.overflow_hidden],
                  pressed && t.atoms.bg,
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
                    hasMedia && [a.pt_md, a.border_t, borderColor],
                    /* Separates the body from the footer divider below. */
                    !publisher && a.pb_sm,
                    {gap: 5},
                  ]}>
                  {publisher && (
                    <DocumentPublicationRow
                      view={publisher}
                      style={menuClearance}
                    />
                  )}
                  <View style={[{gap: 3}]}>
                    <View style={!publisher && menuClearance}>
                      <Text
                        emoji
                        numberOfLines={3}
                        style={[a.text_lg, a.font_bold, a.leading_snug]}>
                        {view.title}
                      </Text>
                    </View>
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

                {!publisher && (
                  <View>
                    <Divider />
                    <View style={[a.pt_sm]}>
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
              style={!hasMedia && {top: 0, right: 0}}
            />
          )}
        </View>
      </View>
    </View>
  )
}

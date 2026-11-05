import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {niceDate} from '#/lib/strings/time'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme, web} from '#/alf'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import {StandardSiteMetaRow} from '#/components/atmosphere/SiteStandard/StandardSiteMetaRow'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {Divider} from '#/components/Divider'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {Heart2_Stroke2_Corner0_Rounded as Heart} from '#/components/icons/Heart2'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'

export function Document({
  preview,
  view,
  onEmbedInteractionCallback,
  style,
  menu,
}: ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticle
    style?: StyleProp<ViewStyle>
    /**
     * Rendered as a sibling of the article link, so it must position itself
     * (e.g. absolutely, top right). It can't live inside the link because
     * interactive elements can't nest in one. Content that would sit under
     * the menu is padded away when there's no image to hold it.
     */
    menu?: React.ReactNode
  }) {
  const ax = useAnalytics()
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const niceUrl = toNiceDomain(view.uri)
  const imageUri = view.image
  const publisher = view.publisher
  const hasMedia = Boolean(imageUri)
  const likeCount = view.likeCount
  const menuClearance = !!menu && !hasMedia && a.pr_5xl

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
                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.gap_sm,
                      a.pb_xs,
                      menuClearance,
                    ]}>
                    <PublicationIcon view={publisher} size={20} />
                    <Text
                      emoji
                      numberOfLines={1}
                      style={[
                        a.flex_1,
                        a.text_xs,
                        a.font_medium,
                        a.leading_tight,
                        t.atoms.text,
                      ]}>
                      {publisher.title}
                    </Text>
                  </View>
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

                {!!(view.createdAt || likeCount || view.readingTime) && (
                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.gap_md,
                      {paddingTop: 2},
                    ]}>
                    {view.createdAt && (
                      <Text
                        style={[
                          a.text_xs,
                          a.leading_snug,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {niceDate(i18n, view.createdAt, 'long', 'none')}
                      </Text>
                    )}
                    {!!likeCount && (
                      <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
                        <Heart size="xs" style={t.atoms.text_contrast_medium} />
                        <Text
                          style={[
                            a.text_xs,
                            a.leading_snug,
                            t.atoms.text_contrast_medium,
                          ]}>
                          {formatCount(i18n, likeCount)}
                        </Text>
                      </View>
                    )}
                    {!!view.readingTime && (
                      <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
                        <Clock size="xs" style={t.atoms.text_contrast_medium} />
                        <Text
                          style={[
                            a.text_xs,
                            a.leading_snug,
                            t.atoms.text_contrast_medium,
                          ]}>
                          {l({
                            message: plural(view.readingTime, {
                              one: '#m',
                              other: '#m',
                            }),
                            comment: `How long it takes to read an article, in minutes. Displayed in a short form, e.g. "5m" for 5 minutes.`,
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
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

      {menu}
    </View>
  )
}

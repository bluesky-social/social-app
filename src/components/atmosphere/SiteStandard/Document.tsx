import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {niceDate} from '#/lib/strings/time'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme, web} from '#/alf'
import {PublicationFooter} from '#/components/atmosphere/SiteStandard/PublicationFooter'
import {StandardSiteMetaRow} from '#/components/atmosphere/SiteStandard/StandardSiteMetaRow'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {isStandardSiteEmbed} from '#/components/atmosphere/SiteStandard/utils'
import {Divider} from '#/components/Divider'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
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
}: ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticle
    style?: StyleProp<ViewStyle>
  }) {
  const ax = useAnalytics()
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const haptics = useHaptics()
  const niceUrl = toNiceDomain(view.uri)
  const imageUri = view.image
  const publisher = view.publisher
  const hasMedia = Boolean(imageUri)
  const isStandard = isStandardSiteEmbed(view)

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
  const onPressPublication = () => {
    haptics.tap()
    onEmbedInteractionCallback?.()
    ax.metric('embed:standardSite:publication:press', {
      url: publisher?.uri || '',
    })
  }
  const onLongPressPublication = IS_NATIVE
    ? () => {
        if (publisher?.uri) {
          haptics.longPress()
          void shareUrl(publisher.uri)
          ax.metric('embed:standardSite:publication:longPress', {
            url: publisher.uri,
          })
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
       * menu has something to lift. The publication footer below lives outside
       * it - it has its own link (to the publication) and Subscribe button, so
       * it can't be nested inside the article's peek.
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
              a.overflow_hidden,
              /*
               * The container can't clip (overflow_hidden there breaks the peek
               * lift animation), so each half rounds its own outer corners to
               * match the container border. The article rounds the top, plus the
               * bottom when there's no footer beneath it.
               */
              {
                borderTopLeftRadius: a.rounded_lg.borderRadius,
                borderTopRightRadius: a.rounded_lg.borderRadius,
              },
              !publisher && {
                borderBottomLeftRadius: a.rounded_lg.borderRadius,
                borderBottomRightRadius: a.rounded_lg.borderRadius,
              },
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
                a.pt_sm,
                hasMedia && a.border_t,
                interacted
                  ? t.atoms.border_contrast_high
                  : t.atoms.border_contrast_low,
                {gap: 3},
                isStandard && a.pt_md,
              ]}>
              <View
                style={[
                  a.pb_xs,
                  a.px_md,
                  {gap: 3},
                  isStandard && [{gap: 5}, a.pb_sm],
                ]}>
                <Text
                  emoji
                  numberOfLines={3}
                  style={[
                    a.text_md,
                    a.font_semi_bold,
                    a.leading_snug,
                    isStandard && [a.text_lg, a.font_bold],
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

                {isStandard && (view.createdAt || view.readingTime) && (
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
                    {view.readingTime && (
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

      {publisher && (
        <View>
          <Divider />
          <PublicationFooter
            preview={preview}
            view={publisher}
            onPress={onPressPublication}
            onLongPress={onLongPressPublication}
            interactedOuter={interacted}
            onEmbedInteractionCallback={onEmbedInteractionCallback}
          />
        </View>
      )}
    </View>
  )
}

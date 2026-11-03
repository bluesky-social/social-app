import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {makeProfileLink} from '#/lib/routes/links'
import {sanitizeHandle} from '#/lib/strings/handles'
import {niceDate} from '#/lib/strings/time'
import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {PageText_Stroke2_Corner0_Rounded as IconPage} from '#/components/icons/Page'
import {InlineLinkText, Link} from '#/components/Link'
import {ProfileHoverCard} from '#/components/ProfileHoverCard'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {type app} from '#/lexicons'
import {type ExploreGalleryFocusProps} from './ExploreGallery'

export function ArticleCard({
  article,
  width,
  galleryFocus,
}: {
  article: app.bsky.embed.external.ViewArticle
  width?: number
  galleryFocus?: ExploreGalleryFocusProps
}) {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  const author = article.associatedProfiles?.[0]
  if (!author) return null

  return (
    <View
      style={[
        a.flex_grow,
        width ? {width} : a.w_full,
        a.rounded_md,
        a.border,
        interacted
          ? [t.atoms.bg_contrast_25, t.atoms.border_contrast_high]
          : [t.atoms.bg, t.atoms.border_contrast_low],
        t.atoms.shadow_xs,
      ]}>
      <View style={[a.flex_1, a.rounded_md, a.overflow_hidden]}>
        <Link
          to={article.uri}
          label={l`Open ${article.title.trim()}`}
          ref={galleryFocus?.focusRef}
          tabIndex={galleryFocus?.tabIndex}
          {...web({
            onMouseEnter: onInteract,
            onMouseLeave: onInteractOut,
          })}
          onFocus={() => {
            onInteract()
            galleryFocus?.onFocus()
          }}
          onBlur={onInteractOut}
          style={[a.flex_col, a.flex_1, a.w_full]}>
          {article.image ? (
            <View
              style={[a.w_full, t.atoms.bg_contrast_50, {aspectRatio: 16 / 9}]}>
              <Image
                source={article.image}
                contentFit="cover"
                style={[a.absolute, a.inset_0, a.w_full, a.h_full]}
                accessible={false}
              />
            </View>
          ) : (
            <View
              style={[
                a.align_center,
                a.justify_center,
                a.w_full,
                a.p_md,
                t.atoms.bg_contrast_50,
              ]}>
              <IconPage size="md" fill={t.atoms.text_contrast_low.color} />
            </View>
          )}
          <View style={[a.w_full, a.flex_1, a.p_md]}>
            {article.publisher?.title || article.publisher?.logo ? (
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.gap_sm,
                  IS_NATIVE ? a.pb_xs : a.pb_sm,
                  {alignSelf: 'flex-start'},
                ]}>
                {article.publisher?.logo ? (
                  <Image
                    source={article.publisher.logo}
                    contentFit="cover"
                    style={[a.rounded_xs, {width: 16, height: 16}]}
                    accessible={false}
                  />
                ) : undefined}
                {article.publisher?.title ? (
                  <Text
                    emoji
                    style={[a.text_xs, a.font_medium]}
                    numberOfLines={1}>
                    {article.publisher.title}
                  </Text>
                ) : undefined}
              </View>
            ) : undefined}
            <View style={[a.flex_1, a.gap_xs]}>
              <Text
                emoji
                style={[a.text_md, a.font_bold, a.leading_tight]}
                numberOfLines={2}>
                {article.title.trim()}
              </Text>
              {article.description ? (
                <Text
                  emoji
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={article.image ? 2 : 6}>
                  {article.description}
                </Text>
              ) : undefined}
            </View>
            <View style={[a.gap_xs, a.pt_md]}>
              <Text
                emoji
                style={[
                  a.text_xs,
                  a.leading_tight,
                  t.atoms.text_contrast_medium,
                ]}
                numberOfLines={1}>
                {article.createdAt && (
                  <Text
                    emoji
                    style={[
                      a.text_xs,
                      a.leading_tight,
                      t.atoms.text_contrast_medium,
                    ]}>
                    {niceDate(i18n, article.createdAt, 'medium', 'none')}
                    {' • '}
                  </Text>
                )}
                <Text
                  emoji
                  style={[
                    a.text_xs,
                    a.leading_tight,
                    t.atoms.text_contrast_medium,
                  ]}>
                  by{' '}
                  <ProfileHoverCard did={author.did}>
                    <InlineLinkText
                      label={l`Open ${sanitizeHandle(author.handle, '@')}'s profile`}
                      to={makeProfileLink({
                        handle: author.handle,
                        did: author.did,
                      })}
                      style={[
                        a.text_xs,
                        a.leading_tight,
                        t.atoms.text_contrast_medium,
                      ]}>
                      {sanitizeHandle(author.handle, '@')}
                    </InlineLinkText>
                  </ProfileHoverCard>
                </Text>
              </Text>
            </View>
          </View>
        </Link>
      </View>
    </View>
  )
}

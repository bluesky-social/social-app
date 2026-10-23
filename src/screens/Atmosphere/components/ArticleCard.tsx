import {View} from 'react-native'
import {Image} from 'expo-image'
import {useLingui} from '@lingui/react/macro'

import {type AtmosphereArticleCardData} from '#/screens/Atmosphere/data/exploreData'
import {atoms as a, useTheme, web} from '#/alf'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'
import {type ExploreGalleryFocusProps} from './ExploreGallery'

export function ArticleCard({
  article,
  width,
  galleryFocus,
}: {
  article: AtmosphereArticleCardData
  width?: number
  galleryFocus?: ExploreGalleryFocusProps
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

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
          to={article.href}
          label={l`Open ${article.title}`}
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
          <View
            style={[a.w_full, t.atoms.bg_contrast_25, {aspectRatio: 16 / 9}]}>
            {article.image ? (
              <Image
                source={article.image}
                contentFit="cover"
                style={[a.absolute, a.inset_0, a.w_full, a.h_full]}
                accessible={false}
              />
            ) : undefined}
          </View>
          <View style={[a.w_full, a.flex_1, a.p_md]}>
            {article.publisher || article.publisherAvatar ? (
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.gap_sm,
                  IS_NATIVE ? a.pb_xs : a.pb_sm,
                  {alignSelf: 'flex-start'},
                ]}>
                {article.publisherAvatar ? (
                  <Image
                    source={article.publisherAvatar}
                    contentFit="cover"
                    style={[a.rounded_xs, {width: 16, height: 16}]}
                    accessible={false}
                  />
                ) : undefined}
                {article.publisher ? (
                  <Text
                    emoji
                    style={[a.text_xs, a.font_medium]}
                    numberOfLines={1}>
                    {article.publisher}
                  </Text>
                ) : undefined}
              </View>
            ) : undefined}
            <View style={[a.flex_1, a.gap_xs]}>
              <Text
                emoji
                style={[a.text_md, a.font_bold, a.leading_tight]}
                numberOfLines={2}>
                {article.title}
              </Text>
              {article.description ? (
                <Text
                  emoji
                  style={[
                    a.text_sm,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}
                  numberOfLines={2}>
                  {article.description}
                </Text>
              ) : undefined}
            </View>
          </View>
        </Link>
      </View>
    </View>
  )
}

import {type StyleProp, View, type ViewStyle} from 'react-native'
import {Image} from 'expo-image'
import {type AppBskyEmbedExternal, AtUri} from '@atproto/api'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {niceDate} from '#/lib/strings/time'
import {toNiceDomain} from '#/lib/strings/url-helpers'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useBreakpoints, useTheme, utils, web} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {Link} from '#/components/Link'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {matchStandardSitePublisher} from '#/components/Post/Embed/StandardSiteEmbed/publishers'
import {StandardSiteMetaRow} from '#/components/Post/Embed/StandardSiteEmbed/StandardSiteMetaRow'
import {StandardSiteThemeProvider} from '#/components/Post/Embed/StandardSiteEmbed/StandardSiteThemeProvider'
import {isStandardSitePublicationEmbed} from '#/components/Post/Embed/StandardSiteEmbed/utils'
import {Text} from '#/components/Typography'
import {IS_NATIVE} from '#/env'

export type ThemeColors = {
  custom: boolean
  accent: string
  accentForeground: string
}

const PUBLICATION_AVATAR_STYLE = {
  borderRadius: a.rounded_sm.borderRadius,
}

export const StandardSiteEmbed = ({
  view,
  onOpen,
  style,
  hideSubscribe,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  hideSubscribe?: boolean
}) => {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const playHaptic = useHaptics()
  const niceUrl = toNiceDomain(view.uri)
  const imageUri = view.thumb
  const hasMedia = Boolean(imageUri)
  const isStandard = view.associatedRefs?.some(ref =>
    new AtUri(ref.uri).collection.startsWith('site.standard.'),
  )
  const isStandardPublication = isStandardSitePublicationEmbed(view)
  let themeColors: ThemeColors = {
    custom: false,
    accent: t.atoms.text.color,
    accentForeground: t.atoms.text_inverted.color,
  }
  const {accentRGB, accentForegroundRGB} = view.source?.theme || {}
  if (accentRGB && accentForegroundRGB) {
    themeColors = {
      custom: true,
      accent: utils.rgbToHex(accentRGB.r, accentRGB.g, accentRGB.b),
      accentForeground: utils.rgbToHex(
        accentForegroundRGB.r,
        accentForegroundRGB.g,
        accentForegroundRGB.b,
      ),
    }
  }

  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  const onPress = () => {
    playHaptic('Light')
    onOpen?.()
  }

  const onLongPress = () => {
    if (view.uri && IS_NATIVE) {
      playHaptic('Heavy')
      shareUrl(view.uri)
    }
  }

  if (isStandardPublication) {
    return (
      <PublicationCard
        hideSubscribe={hideSubscribe}
        view={view}
        onPress={onPress}
        onLongPress={onLongPress}
        style={style}
        themeColors={themeColors}
      />
    )
  }

  return (
    <View
      style={[
        a.flex_col,
        a.rounded_lg,
        a.overflow_hidden,
        a.w_full,
        a.border,
        interacted ? t.atoms.border_contrast_high : t.atoms.border_contrast_low,
        style,
      ]}>
      <Link
        shouldProxy
        to={view.uri}
        label={view.title || l`Open link to ${niceUrl}`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[a.absolute, a.inset_0, a.z_10]}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={onInteract}
        onBlur={onInteractOut}>
        <></>
      </Link>

      <View style={[a.w_full, a.z_10, a.pointer_events_none]}>
        {imageUri ? (
          <Image
            style={[a.aspect_card]}
            source={{uri: imageUri}}
            accessibilityIgnoresInvertColors
            loading="lazy"
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
                numberOfLines={view.thumb ? 2 : 4}
                style={[a.text_sm, a.leading_snug]}>
                {view.description}
              </Text>
            ) : undefined}

            {isStandard && (view.createdAt || view.readingTime) && (
              <View
                style={[a.flex_row, a.align_center, a.gap_md, {paddingTop: 2}]}>
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

        {!view.source && (
          <View style={[a.px_md]}>
            <Divider />
            <View style={[a.py_sm]}>
              <StandardSiteMetaRow view={view} />
            </View>
          </View>
        )}
      </View>

      <View style={[a.z_20]}>
        {view.source && (
          <>
            <Divider />
            <PublicationFooter
              view={view}
              onPress={onPress}
              onLongPress={onLongPress}
              themeColors={themeColors}
              hideSubscribe={hideSubscribe}
            />
          </>
        )}
      </View>
    </View>
  )
}

export function PublicationCard({
  view,
  hideSubscribe,
  onPress,
  onLongPress,
  themeColors,
  style,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  hideSubscribe?: boolean
  onPress?: () => void
  onLongPress?: () => void
  themeColors: ThemeColors
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  if (!view.source) return null

  return (
    <View
      style={[
        a.rounded_lg,
        a.overflow_hidden,
        a.w_full,
        a.border,
        a.p_md,
        interacted ? t.atoms.border_contrast_high : t.atoms.border_contrast_low,
        style,
      ]}>
      <Link
        shouldProxy
        to={view.source.uri}
        label={
          view.source.title ? l`View ${view.source.title}` : l`View publication`
        }
        onPress={onPress}
        onLongPress={onLongPress}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={onInteract}
        onBlur={onInteractOut}
        style={[a.absolute, a.inset_0]}>
        <></>
      </Link>

      <View
        style={[
          a.flex_1,
          a.align_center,
          a.justify_between,
          a.gap_md,
          a.pointer_events_none,
          gtPhone && [a.flex_row, a.gap_sm],
        ]}>
        <View
          style={[
            a.w_full,
            a.flex_row,
            a.align_center,
            a.gap_sm,
            gtPhone && a.flex_1,
          ]}>
          <PublicationIcon
            view={view}
            size={40}
            interacted={interacted}
            themeColors={themeColors}
          />
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text
              numberOfLines={1}
              style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
              {view.source?.title}
            </Text>
            <StandardSiteMetaRow type="publication" view={view} />
          </View>
        </View>

        {!hideSubscribe && gtPhone && (
          <SubscribeButton
            view={view}
            style={[!gtPhone && [a.w_full, a.justify_center]]}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        )}
      </View>

      <View style={[a.pointer_events_none]}>
        {view.description && (
          <View style={[a.pt_sm]}>
            <Text style={[a.text_sm, a.leading_snug]} numberOfLines={3}>
              {view.description}
            </Text>
          </View>
        )}

        {!hideSubscribe && !gtPhone && (
          <View style={[view.description && a.pt_sm]}>
            <SubscribeButton
              view={view}
              style={[!gtPhone && [a.w_full, a.justify_center]]}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          </View>
        )}
      </View>
    </View>
  )
}

export function SubscribeButton({
  view,
  onPress,
  onLongPress,
  style,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  onPress?: () => void
  onLongPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const highlightedPublisher = matchStandardSitePublisher(view)
  const cta = highlightedPublisher
    ? l`Subscribe on ${highlightedPublisher.name}`
    : l`View publication`

  if (!view.source) return null

  const publicationTitle = view.source.title
  const label = highlightedPublisher
    ? publicationTitle
      ? l`Subscribe to ${publicationTitle} on ${highlightedPublisher.name}`
      : l`Subscribe on ${highlightedPublisher.name}`
    : publicationTitle
      ? l`View ${publicationTitle}`
      : l`View publication`

  return (
    <StandardSiteThemeProvider view={view}>
      <Link
        shouldProxy
        to={view.source.uri}
        label={label}
        size="small"
        color="secondary_inverted"
        style={[style, a.gap_sm, a.pointer_events_auto]}
        onPress={onPress}
        onLongPress={onLongPress}>
        {highlightedPublisher ? (
          <>
            <View style={[a.flex_row, a.align_center, {gap: 7}]}>
              <ButtonIcon icon={highlightedPublisher.Icon} size="lg" />
              {/*<ButtonText>|</ButtonText>*/}
            </View>
            <ButtonText>{cta}</ButtonText>
          </>
        ) : (
          <ButtonText>{cta}</ButtonText>
        )}
      </Link>
    </StandardSiteThemeProvider>
  )
}

function PublicationIcon({
  view,
  size,
  themeColors,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  size: number
  interacted?: boolean
  themeColors: ThemeColors
}) {
  if (!view.source) return null
  return view.source?.icon ? (
    <View>
      <UserAvatar
        noBorder
        type="labeler"
        size={size}
        avatar={view.source.icon}
        extraAviStyle={PUBLICATION_AVATAR_STYLE}
      />
      <MediaInsetBorder opaque style={[a.rounded_sm]} />
    </View>
  ) : (
    <View
      style={[
        a.align_center,
        a.justify_center,
        a.rounded_sm,
        {
          width: size,
          height: size,
          backgroundColor: themeColors.accent,
        },
      ]}>
      <Text
        emoji
        style={[a.text_xl, a.font_bold, {color: themeColors.accentForeground}]}>
        {[...view.source.title][0] ?? ''}
      </Text>
      <MediaInsetBorder opaque style={[a.rounded_sm]} />
    </View>
  )
}

export function PublicationFooter({
  view,
  hideSubscribe,
  onPress,
  onLongPress,
  themeColors,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  hideSubscribe?: boolean
  themeColors: ThemeColors
  onPress?: () => void
  onLongPress?: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  if (!view.source) return null

  return (
    <View
      style={[
        a.flex_1,
        a.align_center,
        a.justify_between,
        a.p_md,
        a.gap_md,
        gtPhone && [a.flex_row, a.gap_sm],
      ]}
      testID="publication-embed-footer">
      <Link
        shouldProxy
        to={view.source.uri}
        label={
          view.source.title ? l`View ${view.source.title}` : l`View publication`
        }
        onPress={onPress}
        onLongPress={onLongPress}
        style={[a.absolute, a.inset_0, web({outline: 0})]}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={onInteract}
        onBlur={onInteractOut}>
        <></>
      </Link>

      <View
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.gap_sm,
          gtPhone && a.flex_1,
          a.pointer_events_none,
        ]}>
        <PublicationIcon
          view={view}
          size={32}
          interacted={interacted}
          themeColors={themeColors}
        />
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text
            numberOfLines={1}
            style={[
              a.text_sm,
              a.font_medium,
              t.atoms.text,
              interacted && a.underline,
            ]}>
            {view.source?.title}
          </Text>
          <StandardSiteMetaRow type="publication" view={view} />
        </View>
      </View>

      {!hideSubscribe && (
        <SubscribeButton
          view={view}
          style={[a.z_10, !gtPhone && [a.w_full, a.justify_center]]}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      )}
    </View>
  )
}

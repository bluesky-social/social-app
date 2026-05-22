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
import {atoms as a, useBreakpoints, useTheme, utils} from '#/alf'
import {ButtonIcon, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Clock_Stroke2_Corner0_Rounded as Clock} from '#/components/icons/Clock'
import {Leaflet} from '#/components/icons/community/Leaflet'
import {Offprint} from '#/components/icons/community/Offprint'
import {Pckt} from '#/components/icons/community/Pckt'
import {StandardSite} from '#/components/icons/community/StandardSite'
import {Earth_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
import {Link} from '#/components/Link'
import {MediaInsetBorder} from '#/components/MediaInsetBorder'
import {PublicationMetaRow} from '#/components/Post/Embed/StandardSiteEmbed/PublicationMetaRow'
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

export function useStandardSitePublisherConfig(
  view: AppBskyEmbedExternal.ViewExternal,
) {
  try {
    const u = new URL(view.source?.uri || '')
    if (u.host.endsWith('leaflet.pub')) {
      return {
        name: 'Leaflet',
        Icon: Leaflet,
      }
    } else if (u.host.endsWith('pckt.blog')) {
      return {
        name: 'pckt',
        Icon: Pckt,
      }
    } else if (u.host.endsWith('offprint.app')) {
      return {
        name: 'Offprint',
        Icon: Offprint,
      }
    }
    return null
  } catch (e) {
    return null
  }
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

  const publicationUri = view.associatedRefs?.find(
    ref => new AtUri(ref.uri).collection === 'site.standard.publication',
  )?.uri
  const maybeAuthorDid = publicationUri ? new AtUri(publicationUri)?.did : null

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
        author={{did: maybeAuthorDid}}
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
        a.rounded_md,
        a.overflow_hidden,
        a.w_full,
        a.border,
        t.atoms.border_contrast_low,
        style,
      ]}>
      <Link
        shouldProxy
        to={view.uri}
        label={view.title || l`Open link to ${niceUrl}`}
        onPress={onPress}
        onLongPress={onLongPress}>
        {({hovered}) => (
          <View style={[a.w_full]}>
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
                t.atoms.border_contrast_low,
                hasMedia && a.border_t,
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
                    isStandard && [
                      a.text_lg,
                      a.font_bold,
                      hovered && a.underline,
                    ],
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
                          t.atoms.text_contrast_high,
                        ]}>
                        {niceDate(i18n, view.createdAt, 'medium', 'none')}
                      </Text>
                    )}
                    {view.readingTime && (
                      <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
                        <Clock size="xs" style={t.atoms.text_contrast_high} />
                        <Text
                          style={[
                            a.text_xs,
                            a.leading_snug,
                            t.atoms.text_contrast_high,
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

              {!view.source && (
                <View style={[a.px_md]}>
                  <Divider />
                  <View
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.gap_2xs,
                      a.pb_sm,
                      {
                        paddingTop: 6, // off menu
                      },
                    ]}>
                    <Globe
                      size="xs"
                      style={[
                        a.transition_color,
                        hovered
                          ? t.atoms.text_contrast_medium
                          : t.atoms.text_contrast_low,
                      ]}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        a.transition_color,
                        a.text_xs,
                        a.leading_snug,
                        hovered
                          ? t.atoms.text_contrast_high
                          : t.atoms.text_contrast_medium,
                      ]}>
                      {toNiceDomain(view.uri)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </Link>

      {view.source && (
        <>
          <View style={[a.px_md]}>
            <Divider />
          </View>
          <PublicationFooter
            view={view}
            onPress={onPress}
            onLongPress={onLongPress}
            themeColors={themeColors}
            author={{did: maybeAuthorDid}}
          />
        </>
      )}
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
  author,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  hideSubscribe?: boolean
  onPress?: () => void
  onLongPress?: () => void
  themeColors: ThemeColors
  style?: StyleProp<ViewStyle>
  author: {did: string | null | undefined}
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {
    state: interactedWithin,
    onIn: onInteractWithin,
    onOut: onInteractWithout,
  } = useInteractionState()

  if (!view.source) return null

  return (
    <Link
      shouldProxy
      to={view.source.uri}
      label={l`Subscribe`}
      onPress={onPress}
      onLongPress={onLongPress}>
      {({hovered: maybeHovered}) => {
        const hovered = maybeHovered && !interactedWithin
        return (
          <View
            style={[
              a.flex_col,
              a.rounded_md,
              a.overflow_hidden,
              a.w_full,
              a.border,
              a.p_md,
              t.atoms.border_contrast_low,
              style,
            ]}>
            <View
              style={[
                a.flex_1,
                a.align_center,
                a.justify_between,
                a.gap_md,
                gtPhone && [a.flex_row, a.gap_sm],
              ]}
              testID="publication-embed-footer">
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
                  hovered={hovered}
                  themeColors={themeColors}
                />
                <View style={[a.flex_1, a.gap_2xs]}>
                  <Text
                    numberOfLines={1}
                    style={[
                      a.text_md,
                      a.font_semi_bold,
                      t.atoms.text,
                      hovered && a.underline,
                    ]}>
                    {view.source?.title}
                  </Text>
                  <PublicationMetaRow
                    view={view}
                    author={author}
                    onInteractWithin={onInteractWithin}
                    onInteractWithout={onInteractWithout}
                  />
                </View>
              </View>

              {!hideSubscribe && (
                <SubscribeButton
                  view={view}
                  style={[!gtPhone && [a.w_full, a.justify_center]]}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              )}
            </View>

            {view.description && (
              <View style={[a.pt_sm]}>
                <Text style={[a.text_sm, a.leading_snug]} numberOfLines={3}>
                  {view.description}
                </Text>
              </View>
            )}
          </View>
        )
      }}
    </Link>
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
  const highlightedPublisher = useStandardSitePublisherConfig(view)
  const cta = highlightedPublisher
    ? l`Subscribe on ${highlightedPublisher.name}`
    : l`View publication`

  if (!view.source) return null

  return (
    <StandardSiteThemeProvider view={view}>
      <Link
        shouldProxy
        to={view.source.uri}
        label={cta}
        size="small"
        color="secondary_inverted"
        style={[style, a.gap_sm]}
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
  hovered,
  themeColors,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  size: number
  hovered?: boolean
  themeColors: ThemeColors
}) {
  const opacity = hovered ? 0.6 : 0.2
  return view.source?.icon ? (
    <View>
      <UserAvatar
        noBorder
        type="labeler"
        size={size}
        avatar={view.source.icon}
        extraAviStyle={PUBLICATION_AVATAR_STYLE}
      />
      <MediaInsetBorder
        style={[
          a.rounded_sm,
          {
            borderColor: themeColors.accentForeground,
            opacity,
          },
        ]}
      />
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
      <StandardSite width={size * 0.8} fill={themeColors.accentForeground} />
      <MediaInsetBorder
        style={[
          a.rounded_sm,
          {
            borderColor: themeColors.accentForeground,
            opacity,
          },
        ]}
      />
    </View>
  )
}

export function PublicationFooter({
  view,
  hideSubscribe,
  onPress,
  onLongPress,
  themeColors,
  author,
}: {
  view: AppBskyEmbedExternal.ViewExternal
  hideSubscribe?: boolean
  themeColors: ThemeColors
  onPress?: () => void
  onLongPress?: () => void
  author: {did: string | null | undefined}
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtPhone} = useBreakpoints()
  const {
    state: maybeHovered,
    onIn: onHoverIn,
    onOut: onHoverOut,
  } = useInteractionState()
  const {
    state: interactedWithin,
    onIn: onInteractWithin,
    onOut: onInteractWithout,
  } = useInteractionState()
  const hovered = maybeHovered && !interactedWithin

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
      testID="publication-embed-footer"
      // @ts-ignore it's Fine™
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}>
      <Link
        shouldProxy
        to={view.source.uri}
        label={l`Subscribe`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          a.w_full,
          a.flex_row,
          a.align_center,
          a.gap_sm,
          gtPhone && a.flex_1,
        ]}>
        <PublicationIcon
          view={view}
          size={32}
          hovered={hovered}
          themeColors={themeColors}
        />
        <View style={[a.flex_1, a.gap_2xs]}>
          <Text
            numberOfLines={1}
            style={[
              a.text_sm,
              a.font_medium,
              t.atoms.text,
              hovered && a.underline,
            ]}>
            {view.source?.title}
          </Text>
          <PublicationMetaRow
            view={view}
            author={author}
            onInteractWithin={onInteractWithin}
            onInteractWithout={onInteractWithout}
          />
        </View>
      </Link>

      {!hideSubscribe && (
        <SubscribeButton
          view={view}
          style={[!gtPhone && [a.w_full, a.justify_center]]}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      )}
    </View>
  )
}

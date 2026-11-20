import {
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {plural} from '@lingui/core/macro'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {formatCount} from '#/view/com/util/numeric/format'
import {atoms as a, useTheme, utils} from '#/alf'
import {matchStandardSiteHostByPublication} from '#/components/atmosphere/SiteStandard/publishers'
import {StandardSiteThemeProvider} from '#/components/atmosphere/SiteStandard/StandardSiteThemeProvider'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/**
 * "Read" and "Recommend" buttons for a document card, plus recommender social
 * proof. Interactive elements can't nest in the card's article link, so cards
 * render a `ghost` inside the link to reserve space, and overlay the real
 * actions on it.
 */
export function DocumentActions({
  view,
  ghost = false,
  interacted = false,
  style,
}: {
  view: app.bsky.embed.external.ViewArticle
  /**
   * Renders an invisible, non-interactive copy that takes up the same space
   * as the real actions. Sizing comes from the same components, so it
   * tracks font scaling with no measuring or layout shift.
   */
  ghost?: boolean
  /** Whether the card is hovered or focused, to match its background. */
  interacted?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const publisher = view.publisher
  const host = publisher ? matchStandardSiteHostByPublication(publisher) : null

  const readText = host
    ? l({
        message: `Read on ${host.name}`,
        comment:
          'Button that opens an article on the platform it was published with, e.g. “Read on Leaflet”',
      })
    : l`Read article`
  const recommendText = l({
    message: 'Recommend',
    comment: 'Button that recommends (likes) an article',
  })

  /*
   * The custom site theme paints the button background with `accent` and the
   * text with `accentForeground`. Only honor it when that pairing clears WCAG
   * AAA (4.5:1) for large text, which the button's bold label qualifies as.
   * Otherwise we fall through to the default `secondary_inverted` styling,
   * which is guaranteed to be legible.
   */
  const theme = publisher && getPublicationTheme(publisher)
  let useCustomTheme = false
  if (theme) {
    const ratio = utils.contrastRatio(theme.accent, theme.accentForeground)
    useCustomTheme = ratio !== null && ratio >= 4.5
  }

  const PressableComponent = ghost ? GhostPressable : undefined

  // TODO: hook up Read and Recommend
  const readButton = (
    <Button
      PressableComponent={PressableComponent}
      label={readText}
      size="small"
      color="secondary_inverted"
      style={[a.flex_1]}
      onPress={() => {}}>
      {host ? (
        <>
          <ButtonIcon icon={host.Icon} />
          <ButtonText>{readText}</ButtonText>
        </>
      ) : (
        <>
          <ButtonText>{readText}</ButtonText>
          <ButtonIcon icon={ArrowTopRightIcon} />
        </>
      )}
    </Button>
  )

  return (
    <View
      aria-hidden={ghost}
      accessibilityElementsHidden={ghost}
      importantForAccessibility={ghost ? 'no-hide-descendants' : 'auto'}
      style={[a.gap_md, ghost && [a.pointer_events_none, {opacity: 0}], style]}>
      <View style={[a.flex_row, a.gap_sm]}>
        {publisher && useCustomTheme ? (
          <StandardSiteThemeProvider view={publisher}>
            {readButton}
          </StandardSiteThemeProvider>
        ) : (
          readButton
        )}
        <Button
          PressableComponent={PressableComponent}
          label={recommendText}
          size="small"
          color="secondary"
          style={[a.flex_1]}
          onPress={() => {}}>
          <ButtonIcon icon={SparkleIcon} />
          <ButtonText>{recommendText}</ButtonText>
        </Button>
      </View>
      <SocialProof
        view={view}
        interacted={interacted}
        PressableComponent={PressableComponent}
      />
    </View>
  )
}

/**
 * "Recommended by {name} +N others", from the view's preview `likers` (up to
 * three). The named liker is one of `likeCount`, so they're not in the +N.
 */
function SocialProof({
  view,
  interacted,
  PressableComponent,
}: {
  view: app.bsky.embed.external.ViewArticle
  interacted: boolean
  PressableComponent?: React.ComponentType<PressableProps>
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const moderationOpts = useModerationOpts()

  const likers = view.likers?.slice(0, 3) ?? []
  const liker = likers[0]
  if (!liker) return null

  const name = sanitizeDisplayName(
    liker.displayName || liker.handle,
    moderationOpts
      ? moderateProfile(liker, moderationOpts).ui('displayName')
      : undefined,
  )
  const others = Math.max((view.likeCount ?? 0) - 1, 0)
  const othersCount = formatCount(i18n, others)
  const label =
    others > 0
      ? l({
          message: plural(others, {
            one: `Recommended by ${name} and ${othersCount} other`,
            other: `Recommended by ${name} and ${othersCount} others`,
          }),
          comment: 'Accessibility label for who recommended an article',
        })
      : l`Recommended by ${name}`
  const nameStyle = [a.font_semi_bold, t.atoms.text_contrast_medium]

  // TODO: open the list of recommenders
  return (
    <Button
      PressableComponent={PressableComponent}
      label={label}
      style={[a.self_start, a.max_w_full, a.justify_start, a.gap_xs]}
      onPress={() => {}}>
      <AvatarStack
        profiles={likers}
        size={20}
        overlap={6}
        backgroundColor={
          interacted
            ? t.atoms.bg_contrast_25.backgroundColor
            : t.atoms.bg.backgroundColor
        }
      />
      <Text
        emoji
        numberOfLines={1}
        style={[a.flex_shrink, a.text_sm, t.atoms.text_contrast_medium]}>
        {others > 0 ? (
          <Trans comment="Social proof below an article; the bolded name is someone who recommended it">
            Recommended by{' '}
            <Text emoji style={nameStyle}>
              {name}
            </Text>{' '}
            <Plural
              value={others}
              one={`+${othersCount} other`}
              other={`+${othersCount} others`}
            />
          </Trans>
        ) : (
          <Trans comment="Social proof below an article; the bolded name is the only person who recommended it">
            Recommended by{' '}
            <Text emoji style={nameStyle}>
              {name}
            </Text>
          </Trans>
        )}
      </Text>
    </Button>
  )
}

/**
 * Stands in for `Button`'s `Pressable` in a ghost, keeping its styles and
 * children so the layout matches without rendering anything interactive.
 */
function GhostPressable({style, children}: PressableProps) {
  return (
    <View style={typeof style === 'function' ? undefined : style}>
      {typeof children === 'function' ? null : children}
    </View>
  )
}

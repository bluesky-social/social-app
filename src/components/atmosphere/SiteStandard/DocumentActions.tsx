import {type StyleProp, View, type ViewStyle} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useSession} from '#/state/session'
import {formatCount} from '#/view/com/util/numeric/format'
import {isActorHidden} from '#/screens/Atmosphere/ActivityTab/moderation'
import {atoms as a, useTheme, utils} from '#/alf'
import {AtmosphereFirstActionWelcomeDialog} from '#/components/atmosphere/AtmosphereFirstActionWelcomeDialog'
import {GhostPressable} from '#/components/atmosphere/GhostPressable'
import {useAtmosphereLike} from '#/components/atmosphere/likes'
import {getAtmosphereProvider} from '#/components/atmosphere/providers'
import {StandardSiteThemeProvider} from '#/components/atmosphere/SiteStandard/StandardSiteThemeProvider'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/**
 * People the viewer follows who recommended the document within the same
 * stretch of timeline, named in the social proof ahead of `knownLikers`.
 */
export type DocumentRecommenders = {
  /** The ones to show, with moderated actors left out. Never empty. */
  actors: app.bsky.actor.defs.ProfileViewBasic[]
  /** Every one, including moderated actors. */
  actorCount: number
}

/**
 * "Read" and "Recommend" buttons for a document card, plus recommender social
 * proof. Interactive elements can't nest in the card's article link, so cards
 * render a `ghost` inside the link to reserve space, and overlay the real
 * actions on it.
 */
export function DocumentActions({
  view,
  recommenders,
  ghost = false,
  interacted = false,
  onReadPress,
  style,
}: {
  view: app.bsky.embed.external.ViewArticle
  /** Named in the social proof instead of the generic count, when present. */
  recommenders?: DocumentRecommenders
  /**
   * Renders an invisible, non-interactive copy that takes up the same space
   * as the real actions. Sizing comes from the same components, so it
   * tracks font scaling with no measuring or layout shift.
   */
  ghost?: boolean
  /** Whether the card is hovered or focused, to match its background. */
  interacted?: boolean
  /** The card's own press handler, so reading tracks like a card press. */
  onReadPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const {
    canLike: canRecommend,
    isLiked: isRecommended,
    toggle: toggleRecommend,
    firstActionWelcomeDialogControl,
  } = useAtmosphereLike(view, 'recommend')
  const publisher = view.publisher
  const provider = getAtmosphereProvider(view.providerId)

  const readText = provider
    ? l({
        message: `Read on ${provider.name}`,
        comment:
          'Button that opens an article on the platform it was published with, e.g. “Read on Leaflet”',
      })
    : l`Read article`
  const recommendText = isRecommended
    ? l({
        message: 'Recommended',
        comment: 'Button showing the viewer has recommended (liked) an article',
      })
    : l({
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

  const readButton = (
    <Link
      PressableComponent={PressableComponent}
      shouldProxy
      to={view.uri}
      onPress={onReadPress}
      label={readText}
      size="small"
      color="secondary_inverted"
      /* Link left-aligns its content by default. */
      style={[a.flex_1, a.justify_center]}>
      {provider ? (
        <>
          <ButtonIcon icon={provider.Icon} />
          <ButtonText>{readText}</ButtonText>
        </>
      ) : (
        <>
          <ButtonText>{readText}</ButtonText>
          <ButtonIcon icon={ArrowTopRightIcon} />
        </>
      )}
    </Link>
  )

  return (
    <View
      aria-hidden={ghost}
      accessibilityElementsHidden={ghost}
      importantForAccessibility={ghost ? 'no-hide-descendants' : 'auto'}
      /*
       * Only the buttons take touches; gaps and social proof fall through to
       * the card's link beneath. The prop, not the style, since react-native-web
       * drops inline `box-none`.
       */
      pointerEvents={ghost ? 'none' : 'box-none'}
      style={[{gap: 10}, ghost && {opacity: 0}, style]}>
      <View pointerEvents="box-none" style={[a.flex_row, a.gap_sm]}>
        {publisher && useCustomTheme ? (
          <StandardSiteThemeProvider view={publisher}>
            {readButton}
          </StandardSiteThemeProvider>
        ) : (
          readButton
        )}
        {canRecommend && (
          <Button
            PressableComponent={PressableComponent}
            label={
              isRecommended ? l`Remove your recommendation` : recommendText
            }
            size="small"
            color={isRecommended ? 'primary_subtle' : 'secondary'}
            style={[a.flex_1]}
            onPress={toggleRecommend}>
            <ButtonIcon icon={SparkleIcon} />
            <ButtonText>{recommendText}</ButtonText>
          </Button>
        )}
      </View>
      <SocialProof
        view={view}
        recommenders={recommenders}
        interacted={interacted}
      />
      {!ghost && (
        <AtmosphereFirstActionWelcomeDialog
          control={firstActionWelcomeDialogControl}
        />
      )}
    </View>
  )
}

/**
 * "Recommended by {name} +N others", naming only people the viewer follows:
 * `recommenders` from the same stretch of timeline first, then the view's
 * `knownLikers`. The total count is in the card's stats, not here, and with
 * nobody to name there's no row.
 */
function SocialProof({
  view,
  recommenders,
  interacted,
}: {
  view: app.bsky.embed.external.ViewArticle
  recommenders?: DocumentRecommenders
  interacted: boolean
}) {
  const t = useTheme()
  const {i18n} = useLingui()
  const moderationOpts = useModerationOpts()
  const {currentAccount} = useSession()

  const knownLikers = view.viewer?.knownLikers ?? []
  /* `recommenders` are already moderated; the viewer is never shown. */
  const shown = uniqueByDid([
    ...(recommenders?.actors ?? []),
    ...knownLikers.filter(
      profile => moderationOpts && !isActorHidden(profile, moderationOpts),
    ),
  ]).filter(profile => profile.did !== currentAccount?.did)
  const named = shown[0]
  if (!named) return null

  /*
   * Hidden actors still count. The timeline's related activity can be fresher
   * than the view's count.
   */
  const total = Math.max(
    view.viewer?.knownLikerCount ?? 0,
    recommenders?.actorCount ?? 0,
    shown.length,
  )
  const others = total - 1
  const othersCount = formatCount(i18n, others)
  const name = sanitizeDisplayName(
    named.displayName || named.handle,
    moderationOpts
      ? moderateProfile(named, moderationOpts).ui('displayName')
      : undefined,
  )
  const nameStyle = [a.font_semi_bold, t.atoms.text_contrast_medium]

  return (
    <View pointerEvents="none" style={[a.flex_row, a.align_center, a.gap_xs]}>
      <AvatarStack
        profiles={shown.slice(0, 3)}
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
          <Trans comment="Social proof below an article; the bolded name is someone the viewer follows who recommended it, and the count is how many more people the viewer follows recommended it">
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
          <Trans comment="Social proof below an article; the bolded name is the only person the viewer follows who recommended it">
            Recommended by{' '}
            <Text emoji style={nameStyle}>
              {name}
            </Text>
          </Trans>
        )}
      </Text>
    </View>
  )
}

function uniqueByDid<P extends {did: string}>(profiles: P[]): P[] {
  const seen = new Set<string>()
  return profiles.filter(profile => {
    if (seen.has(profile.did)) return false
    seen.add(profile.did)
    return true
  })
}

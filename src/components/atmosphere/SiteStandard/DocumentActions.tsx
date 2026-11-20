import {
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {isNetworkError} from '#/lib/network-error'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useRequireAuth} from '#/state/session'
import {formatCount} from '#/view/com/util/numeric/format'
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {atoms as a, useTheme, utils} from '#/alf'
import {matchStandardSiteHostByPublication} from '#/components/atmosphere/SiteStandard/publishers'
import {useDocumentRecommend} from '#/components/atmosphere/SiteStandard/recommend'
import {StandardSiteThemeProvider} from '#/components/atmosphere/SiteStandard/StandardSiteThemeProvider'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {Link} from '#/components/Link'
import * as Toast from '#/components/Toast'
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
  onReadPress,
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
  /** The card's own press handler, so reading tracks like a card press. */
  onReadPress?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const {t: l} = useLingui()
  const haptics = useHaptics()
  const requireAuth = useRequireAuth()
  const sendFeedback = useAtmosphereFeedback()
  const {canRecommend, isRecommended, likeCount, recommend, unrecommend} =
    useDocumentRecommend(view)
  const publisher = view.publisher
  const host = publisher ? matchStandardSiteHostByPublication(publisher) : null

  const readText = host
    ? l({
        message: `Read on ${host.name}`,
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

  const onPressRecommend = () =>
    requireAuth(async () => {
      haptics.tap()
      try {
        if (isRecommended) {
          await unrecommend()
        } else {
          await recommend()
          sendFeedback?.('app.bsky.feed.defs#interactionLike')
        }
      } catch (e) {
        // A newer toggle replaced this one.
        if ((e as Error)?.name === 'AbortError') return
        if (!isNetworkError(e)) {
          logger.error('Failed to update document recommendation', {
            safeMessage: e,
          })
        }
        Toast.show(
          l({
            message: 'Couldn’t update your recommendation',
            context: 'toast',
          }),
          {type: 'error'},
        )
      }
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
            onPress={onPressRecommend}>
            <ButtonIcon icon={SparkleIcon} />
            <ButtonText>{recommendText}</ButtonText>
          </Button>
        )}
      </View>
      <SocialProof view={view} likeCount={likeCount} interacted={interacted} />
    </View>
  )
}

/**
 * "Recommended by {name} +N others", from the view's preview `likers` (up to
 * three). The named liker is one of `likeCount`, so they're not in the +N.
 */
function SocialProof({
  view,
  likeCount,
  interacted,
}: {
  view: app.bsky.embed.external.ViewArticle
  /** Includes the viewer's optimistic recommendation. */
  likeCount: number
  interacted: boolean
}) {
  const t = useTheme()
  const {i18n} = useLingui()
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
  const others = Math.max(likeCount - 1, 0)
  const othersCount = formatCount(i18n, others)
  const nameStyle = [a.font_semi_bold, t.atoms.text_contrast_medium]

  return (
    <View pointerEvents="none" style={[a.flex_row, a.align_center, a.gap_xs]}>
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
    </View>
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

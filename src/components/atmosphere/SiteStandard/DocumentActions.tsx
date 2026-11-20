import {
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, utils} from '#/alf'
import {matchStandardSiteHostByPublication} from '#/components/atmosphere/SiteStandard/publishers'
import {StandardSiteThemeProvider} from '#/components/atmosphere/SiteStandard/StandardSiteThemeProvider'
import {getPublicationTheme} from '#/components/atmosphere/SiteStandard/utils'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {type app} from '#/lexicons'

/**
 * "Read" and "Recommend" buttons for a document card. Interactive elements
 * can't nest in the card's article link, so cards render a `ghost` inside the
 * link to reserve space, and overlay the real buttons on it.
 */
export function DocumentActions({
  view,
  ghost = false,
  style,
}: {
  view: app.bsky.embed.external.ViewArticle
  /**
   * Renders an invisible, non-interactive copy that takes up the same space
   * as the real buttons. Sizing comes from the same `Button` styles, so it
   * tracks font scaling with no measuring or layout shift.
   */
  ghost?: boolean
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
      style={[
        a.flex_row,
        a.gap_sm,
        ghost && [a.pointer_events_none, {opacity: 0}],
        style,
      ]}>
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

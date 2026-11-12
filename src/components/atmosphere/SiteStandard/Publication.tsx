import {type StyleProp, View, type ViewStyle} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {shareUrl} from '#/lib/sharing'
import {formatCount} from '#/view/com/util/numeric/format'
import {AtmosphereCardMenu} from '#/screens/Atmosphere/components/AtmosphereCardMenu'
import {atoms as a, extractPadding, useTheme, web} from '#/alf'
import {PublicationIcon} from '#/components/atmosphere/SiteStandard/PublicationIcon'
import {matchStandardSiteHostByUrl} from '#/components/atmosphere/SiteStandard/publishers'
import {StandardSiteMetaRow} from '#/components/atmosphere/SiteStandard/StandardSiteMetaRow'
import type * as ssTypes from '#/components/atmosphere/SiteStandard/types'
import {isStandardSitePublicationUri} from '#/components/atmosphere/SiteStandard/utils'
import {AvatarStack} from '#/components/AvatarStack'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {type app, site} from '#/lexicons'

type PublicationProps = ssTypes.PreviewProps &
  ssTypes.PublicApiProps & {
    view: app.bsky.embed.external.ViewArticlePublication
    /**
     * Applied to the outer frame.
     */
    style?: StyleProp<ViewStyle>
    /**
     * Insets the content and its independent menu. Padding stays inside the
     * link's hit area. The menu follows the resolved padding. Use this, not
     * `style`, to inset rows in a list.
     */
    containerStyle?: StyleProp<ViewStyle>
  }

/**
 * Fills its host column with no outer padding, border, or rounding of its own.
 */
export function Publication(props: PublicationProps) {
  return <PublicationBase {...props} card={false} />
}

/**
 * The framed presentation: bordered, rounded, filled, and inset.
 */
export function PublicationCard({containerStyle, ...props}: PublicationProps) {
  return (
    <PublicationBase
      {...props}
      card
      containerStyle={[a.p_md, containerStyle]}
    />
  )
}

function PublicationBase({
  card,
  preview,
  view,
  onEmbedInteractionCallback,
  style,
  containerStyle,
}: PublicationProps & {card: boolean}) {
  const ax = useAnalytics()
  const t = useTheme()
  const {t: l, i18n} = useLingui()
  const haptics = useHaptics()
  const {paddingTop, paddingRight} = extractPadding(containerStyle)
  /* A sibling of the link; interactive elements can't nest in one. */
  const hasMenu = !preview
  const {
    state: interacted,
    onIn: onInteract,
    onOut: onInteractOut,
  } = useInteractionState()

  /* The publication's owner is the repo that holds its publication record. */
  const publicationRef = view.associatedRefs?.find(isStandardSitePublicationUri)
  const authorDid = publicationRef && new AtUri(publicationRef.uri).host
  const author = authorDid
    ? view.associatedProfiles?.find(p => p.did === authorDid)
    : undefined
  const articlePublisher = matchStandardSiteHostByUrl(view.uri)
  const hasSubscribers = !!view.subscribers?.length || !!view.subscriptionCount

  const onPress = () => {
    haptics.tap()
    onEmbedInteractionCallback?.()
    ax.metric('embed:standardSite:publication:press', {url: view.uri})
  }
  const onLongPress = IS_NATIVE
    ? () => {
        haptics.longPress()
        void shareUrl(view.uri)
        ax.metric('embed:standardSite:publication:longPress', {url: view.uri})
      }
    : undefined

  return (
    <View
      testID={card ? 'publicationCard' : 'publication'}
      style={[
        a.relative,
        a.flex_col,
        a.w_full,
        card && [
          a.rounded_lg,
          a.border,
          interacted
            ? t.atoms.border_contrast_high
            : t.atoms.border_contrast_low,
        ],
        interacted && t.atoms.bg_contrast_25,
        preview && a.pointer_events_none,
        style,
      ]}>
      <Link
        shouldProxy
        to={view.uri}
        label={view.title ? l`View ${view.title}` : l`View publication`}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[
          /* Override Button's row/center layout so the padded content stretches. */
          a.flex_col,
          a.align_stretch,
          card && a.rounded_lg,
        ]}
        {...web({
          onMouseEnter: onInteract,
          onMouseLeave: onInteractOut,
        })}
        onFocus={onInteract}
        onBlur={onInteractOut}>
        {({pressed}) => (
          <View style={containerStyle}>
            <View style={[a.w_full, {gap: 10}, pressed && t.atoms.bg]}>
              <View
                style={[
                  a.flex_row,
                  a.align_center,
                  a.gap_sm,
                  hasMenu && a.pr_5xl,
                ]}>
                <PublicationIcon
                  view={view}
                  size={40}
                  interacted={interacted}
                />
                <View style={[a.flex_1, a.gap_2xs]}>
                  <Text
                    emoji
                    numberOfLines={1}
                    style={[
                      a.text_md,
                      a.font_semi_bold,
                      t.atoms.text,
                      a.leading_snug,
                    ]}>
                    {view.title}
                  </Text>

                  <StandardSiteMetaRow
                    preview={preview}
                    type="publication"
                    view={view}
                  />
                </View>
              </View>

              {!!view.description && (
                <Text
                  emoji
                  numberOfLines={3}
                  style={[a.text_sm, a.leading_snug]}>
                  {view.description}
                </Text>
              )}

              {(hasSubscribers || !!articlePublisher) && (
                <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                  {!!view.subscribers?.length && (
                    <AvatarStack
                      size={16}
                      profiles={view.subscribers.slice(0, 3)}
                      backgroundColor={
                        interacted
                          ? t.atoms.bg_contrast_25.backgroundColor
                          : t.atoms.bg.backgroundColor
                      }
                    />
                  )}
                  {!!view.subscriptionCount && (
                    <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                      {l({
                        message: plural(view.subscriptionCount, {
                          one: `${formatCount(i18n, view.subscriptionCount)} subscriber`,
                          other: `${formatCount(i18n, view.subscriptionCount)} subscribers`,
                        }),
                        comment:
                          'Number of people subscribed to a publication.',
                      })}
                    </Text>
                  )}

                  {!!articlePublisher && (
                    <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                      {hasSubscribers ? ' • ' : ''}
                      {l`Powered by ${articlePublisher.name}`}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </Link>

      {hasMenu && (
        <AtmosphereCardMenu
          type="publication"
          item={view}
          reportableTypes={[site.standard.publication.$type]}
          author={author}
          offsetY={paddingTop}
          offsetX={paddingRight}
        />
      )}
    </View>
  )
}
